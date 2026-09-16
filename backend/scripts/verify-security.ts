/**
 * Security regression checks for the tenant-isolation fixes.
 *
 *   pnpm verify:security
 *
 * Runs with no database and no network: model methods are stubbed where a
 * round-trip would otherwise be needed, so this stays fast enough to run on
 * every change. Each section corresponds to a hole that was open before:
 *
 *   1. POST /api/auth/register honoured `role` from the body (privilege escalation).
 *   2. A missing organizationId was dropped by Mongoose, turning a tenant-scoped
 *      query into a global one (cross-tenant read).
 *   3. Org-scoped routers did not all mount requireOrg.
 *   4. Queue/visit/check-in wrote appointment status past the state machine.
 */
process.env.MONGO_URI ??= 'mongodb://127.0.0.1:27017/verify-only-never-connected';
process.env.JWT_SECRET ??= 'verification-secret-that-is-long-enough-32+';

import type { Request, Response } from 'express';

let failures = 0;

const check = (name: string, passed: boolean, detail = ''): void => {
  if (passed) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

/** Minimal Response double that records what a handler sent. */
const mockRes = () => {
  const sent: { status?: number; body?: any } = {};
  const res = {
    status(code: number) {
      sent.status = code;
      return this;
    },
    json(body: unknown) {
      sent.body = body;
      return this;
    },
  };
  return { res: res as unknown as Response, sent };
};

const run = async (): Promise<void> => {
  console.log('\n1. Register cannot self-assign privilege');
  {
    const { User } = await import('../src/modules/users/user.model');
    const { register } = await import('../src/modules/auth/auth.controller');

    let createdWith: any;
    (User as any).findOne = async () => null;
    (User as any).create = async (payload: any) => {
      createdWith = payload;
      return { ...payload, _id: { toString: () => 'stub-id' } };
    };

    const { res, sent } = mockRes();
    await register(
      {
        body: {
          firstName: 'Mallory',
          lastName: 'Attacker',
          email: 'Mallory@Example.com',
          password: 'correct-horse-battery',
          role: 'PLATFORM_ADMIN',
          organizationId: '507f1f77bcf86cd799439011',
        },
      } as Request,
      res
    );

    check('register succeeds', sent.status === 201, `status ${sent.status}`);
    check(
      'requested PLATFORM_ADMIN role is ignored',
      createdWith?.role === 'PATIENT',
      `persisted role '${createdWith?.role}'`
    );
    check(
      'requested organizationId is ignored',
      createdWith?.organizationId === undefined,
      `persisted organizationId '${createdWith?.organizationId}'`
    );

    const { res: res2, sent: sent2 } = mockRes();
    await register(
      {
        body: {
          firstName: 'Weak',
          lastName: 'Password',
          email: 'weak@example.com',
          password: 'short',
        },
      } as Request,
      res2
    );
    check('short password is rejected', sent2.status === 400, `status ${sent2.status}`);
  }

  console.log('\n2. Missing tenant scope fails closed');
  {
    const { orgIdOf, MissingTenantScopeError } = await import('../src/shared/tenant/orgScope');
    const { failed } = await import('../src/shared/http/respond');
    const { requireOrg } = await import('../src/shared/middlewares/auth.middleware');

    let threw: unknown;
    try {
      orgIdOf({ user: { id: 'u1', role: 'ORG_ADMIN' } } as any);
    } catch (e) {
      threw = e;
    }
    check('orgIdOf throws when the caller has no organization', threw instanceof MissingTenantScopeError);

    check(
      'orgIdOf returns the id when present',
      orgIdOf({ user: { id: 'u1', role: 'ORG_ADMIN', organizationId: 'org-a' } } as any) === 'org-a'
    );

    const { res, sent } = mockRes();
    failed(res, 'Error fetching patients', new MissingTenantScopeError());
    check('a missing scope surfaces as 403, not 500', sent.status === 403, `status ${sent.status}`);

    const { res: res2, sent: sent2 } = mockRes();
    failed(res2, 'Error fetching patients', new Error('E11000 duplicate key ... secret index detail'));
    check('internal errors are not echoed to the client', !('error' in (sent2.body ?? {})));
    check(
      'internal error message is generic',
      sent2.body?.message === 'Error fetching patients',
      JSON.stringify(sent2.body)
    );

    let nextCalled = false;
    const { res: res3, sent: sent3 } = mockRes();
    requireOrg({ user: { id: 'u1', role: 'ORG_ADMIN' } } as any, res3, () => {
      nextCalled = true;
    });
    check('requireOrg blocks an org-less caller', sent3.status === 403 && !nextCalled);
  }

  console.log('\n3. Every organization-scoped router mounts requireOrg');
  {
    const { requireOrg } = await import('../src/shared/middlewares/auth.middleware');

    const orgScoped = [
      ['appointments', '../src/modules/appointments/appointment.routes'],
      ['patients', '../src/modules/patients/patient.routes'],
      ['queues', '../src/modules/queues/queue.routes'],
      ['schedules', '../src/modules/schedules/schedule.routes'],
      ['visits', '../src/modules/visits/visit.routes'],
      ['analytics', '../src/modules/analytics/analytics.routes'],
      ['check-ins', '../src/modules/check-ins/checkIn.routes'],
      ['departments', '../src/modules/departments/department.routes'],
      ['locations', '../src/modules/locations/location.routes'],
      ['services', '../src/modules/services/service.routes'],
      ['practitioners', '../src/modules/practitioners/practitioner.routes'],
    ] as const;

    for (const [name, path] of orgScoped) {
      const router = (await import(path)).default;
      const mounted = (router.stack ?? []).some((layer: any) => layer.handle === requireOrg);
      check(`${name} router mounts requireOrg`, mounted);
    }
  }

  console.log('\n4. Appointment state machine is not bypassable');
  {
    const { canTransition, syncAppointmentStatus } = await import(
      '../src/modules/appointments/appointment.service'
    );
    const { Appointment } = await import('../src/modules/appointments/appointment.model');

    check('strict API still forbids BOOKED to COMPLETED', !canTransition('BOOKED', 'COMPLETED'));
    check('strict API still allows BOOKED to CONFIRMED', canTransition('BOOKED', 'CONFIRMED'));
    check('nothing leaves CANCELLED', !canTransition('CANCELLED', 'COMPLETED'));

    // A visit completing against an already-cancelled appointment.
    let saved = false;
    (Appointment as any).findOne = async () => ({
      status: 'CANCELLED',
      save: async () => {
        saved = true;
      },
    });
    const skipped = await syncAppointmentStatus('a1', 'org-a', 'COMPLETED');
    check('sync CANCELLED to COMPLETED is skipped', skipped === 'skipped', `got '${skipped}'`);
    check('the cancelled appointment is never written', !saved);

    // A walk-in going straight from BOOKED into the queue is legitimate.
    let walkInStatus = 'BOOKED';
    (Appointment as any).findOne = async () => ({
      get status() {
        return walkInStatus;
      },
      set status(v: string) {
        walkInStatus = v;
      },
      save: async () => {},
    });
    const applied = await syncAppointmentStatus('a2', 'org-a', 'IN_QUEUE');
    check('walk-in BOOKED to IN_QUEUE still applies', applied === 'applied', `got '${applied}'`);
    check('walk-in appointment reaches IN_QUEUE', walkInStatus === 'IN_QUEUE', walkInStatus);

    // No-shows must remain reachable from an active appointment.
    let activeStatus = 'IN_QUEUE';
    (Appointment as any).findOne = async () => ({
      get status() {
        return activeStatus;
      },
      set status(v: string) {
        activeStatus = v;
      },
      save: async () => {},
    });
    const noShow = await syncAppointmentStatus('a3', 'org-a', 'NO_SHOW');
    check('IN_QUEUE to NO_SHOW still applies', noShow === 'applied', `got '${noShow}'`);
  }

  console.log(
    failures === 0 ? '\nAll security checks passed.' : `\n${failures} check(s) FAILED.`
  );
  process.exit(failures === 0 ? 0 : 1);
};

void run().catch((error: unknown) => {
  console.error('Verification harness error:', error);
  process.exit(1);
});
