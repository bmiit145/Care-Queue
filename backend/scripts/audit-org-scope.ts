/**
 * Finds accounts that the new `requireOrg` guard will start rejecting, and
 * optionally repairs them.
 *
 * Staff roles now need an organizationId on every organization-scoped route.
 * Before this change a missing one silently widened queries to every tenant,
 * so accounts created through the old open register endpoint may have a
 * privileged role and no organization at all. Those accounts will get 403
 * once the fix deploys.
 *
 * Report what would break (read-only, safe to run against production):
 *   pnpm orgscope:audit
 *
 * Repair named accounts:
 *   pnpm orgscope:audit -- --assign=<organizationId> --emails=a@x.com,b@y.com --confirm
 *
 * Repair every org-less staff account at once:
 *   pnpm orgscope:audit -- --assign=<organizationId> --all-staff --confirm
 *
 * Without --confirm nothing is written; the script prints the exact changes
 * it would make. PATIENT accounts are never touched: a patient legitimately
 * has no organization until they enrol with one.
 */
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { User } from '../src/modules/users/user.model';
import { Organization } from '../src/modules/organizations/organization.model';

const STAFF_ROLES = ['ORG_ADMIN', 'RECEPTIONIST', 'PRACTITIONER', 'STAFF'] as const;

const flag = (name: string): string | undefined => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(`--${name}=`.length);
};
const has = (name: string): boolean => process.argv.includes(`--${name}`);

const run = async (): Promise<void> => {
  const assign = flag('assign');
  const emails = flag('emails')?.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  const allStaff = has('all-staff');
  const confirm = has('confirm');

  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10_000 });

  const breakdown = await User.collection
    .aggregate([
      {
        $group: {
          _id: {
            role: '$role',
            hasOrg: { $cond: [{ $ifNull: ['$organizationId', false] }, true, false] },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ])
    .toArray();

  console.log('\nAccounts by role and organization scope');
  console.log('role             has org   count');
  console.log('---------------- -------   -----');
  for (const row of breakdown) {
    const { role, hasOrg } = row._id as { role: string; hasOrg: boolean };
    console.log(`${String(role).padEnd(16)} ${String(hasOrg).padEnd(9)} ${row.count}`);
  }

  const atRisk = await User.find({
    role: { $in: STAFF_ROLES as unknown as string[] },
    organizationId: { $exists: false },
    isActive: true,
  })
    .select('email role')
    .lean();

  if (atRisk.length === 0) {
    console.log('\nNo active staff account is missing an organization. Safe to deploy.');
  } else {
    console.log(`\n${atRisk.length} active staff account(s) will be refused after the fix deploys:`);
    for (const u of atRisk) {
      console.log(`  ${u.role.padEnd(14)} ${u.email}`);
    }
    console.log(
      '\nPLATFORM_ADMIN is intentionally excluded — it does not need an organization,\n' +
        'but it will no longer reach organization-scoped routes without one. That was\n' +
        'only ever working because the tenant filter was being dropped.'
    );
  }

  if (!assign) {
    if (atRisk.length > 0) {
      console.log('\nTo repair, re-run with --assign=<organizationId> plus --emails=... or --all-staff.');
      const orgs = await Organization.find({ isActive: true }).select('_id name').limit(20).lean();
      if (orgs.length > 0) {
        console.log('\nAvailable organizations:');
        for (const o of orgs) console.log(`  ${o._id}  ${o.name}`);
      } else {
        console.log('\nNo active organizations exist yet — create one before assigning.');
      }
    }
    await mongoose.connection.close(false);
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(assign)) {
    console.error(`\n--assign=${assign} is not a valid ObjectId.`);
    process.exit(1);
  }

  const org = await Organization.findById(assign).select('_id name').lean();
  if (!org) {
    console.error(`\nNo organization with id ${assign}.`);
    process.exit(1);
  }

  if (!emails && !allStaff) {
    console.error('\nSpecify which accounts: --emails=a@x.com,b@y.com or --all-staff.');
    process.exit(1);
  }

  const targets = emails
    ? atRisk.filter((u) => emails.includes(u.email.toLowerCase()))
    : atRisk;

  if (emails) {
    const missing = emails.filter(
      (e) => !atRisk.some((u) => u.email.toLowerCase() === e)
    );
    for (const m of missing) {
      console.warn(`\n  skipped ${m} — not an active staff account missing an organization`);
    }
  }

  if (targets.length === 0) {
    console.log('\nNothing to change.');
    await mongoose.connection.close(false);
    return;
  }

  console.log(`\n${confirm ? 'Assigning' : 'Would assign'} organization ${org.name} (${assign}) to:`);
  for (const u of targets) console.log(`  ${u.role.padEnd(14)} ${u.email}`);

  if (!confirm) {
    console.log('\nDry run — nothing written. Re-run with --confirm to apply.');
    await mongoose.connection.close(false);
    return;
  }

  const result = await User.updateMany(
    { _id: { $in: targets.map((u) => u._id) } },
    { $set: { organizationId: new mongoose.Types.ObjectId(assign) } }
  );

  console.log(`\nUpdated ${result.modifiedCount} account(s).`);
  console.log('Those users must sign in again — their existing tokens carry no organization.');

  await mongoose.connection.close(false);
};

void run().catch((error: unknown) => {
  console.error('Audit failed:', error);
  process.exitCode = 1;
});
