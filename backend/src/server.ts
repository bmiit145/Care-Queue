import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import { env } from './config/env';
import connectDB from './config/db';
import { swaggerSpec } from './config/swagger';

import authRoutes from './modules/auth/auth.routes';
import organizationRoutes from './modules/organizations/organization.routes';
import userRoutes from './modules/users/user.routes';
import locationRoutes from './modules/locations/location.routes';
import departmentRoutes from './modules/departments/department.routes';
import serviceRoutes from './modules/services/service.routes';
import practitionerRoutes from './modules/practitioners/practitioner.routes';
import scheduleRoutes from './modules/schedules/schedule.routes';
import patientRoutes from './modules/patients/patient.routes';
import checkInRoutes from './modules/check-ins/checkIn.routes';
import appointmentRoutes from './modules/appointments/appointment.routes';
import queueRoutes from './modules/queues/queue.routes';
import visitRoutes from './modules/visits/visit.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header('x-request-id') || randomUUID();
  res.setHeader('x-request-id', requestId);
  next();
});

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Keep the existing API envelope contract for the mobile/web clients.
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const record = body as Record<string, unknown>;

      if (
        record.success !== undefined ||
        record.swagger !== undefined ||
        record.openapi !== undefined ||
        req.path === '/' ||
        req.path.startsWith('/api-docs')
      ) {
        return originalJson(body);
      }

      if (res.statusCode >= 400) {
        return originalJson({
          success: false,
          message: typeof record.message === 'string' ? record.message : 'An error occurred',
          error: record.error ?? record,
        });
      }

      return originalJson({ success: true, data: body });
    }

    return originalJson(body);
  }) as typeof res.json;

  next();
});

app.get('/health/live', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

app.get('/health/ready', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    success: ready,
    data: { status: ready ? 'ready' : 'not-ready' },
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/practitioners', practitionerRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/check-ins', checkInRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (_req, res) => {
  res.json({
    service: 'Care-Queue Backend API',
    status: 'running',
    docs: '/api-docs',
    version: '1.0.0',
  });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled request error:', err);
  if (res.headersSent) return;

  res.status(500).json({
    message: env.nodeEnv === 'production' ? 'Internal server error' : 'Internal server error',
  });
});

const start = async (): Promise<void> => {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`Care-Queue API listening on port ${env.port}`);
    console.log(`Swagger docs: http://localhost:${env.port}/api-docs`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      await mongoose.connection.close(false);
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 15_000).unref();
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
};

void start().catch((error: unknown) => {
  console.error('Failed to start Care-Queue API:', error);
  process.exitCode = 1;
});

export default app;
