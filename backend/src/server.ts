import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

dotenv.config();

const app = express();

// ─────────────────────────────────────────
// Security middleware
// ─────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// Global API Response Wrapper
// Formats all JSON responses into { success, data, error, message }
// for standardized Flutter parsing.
// ─────────────────────────────────────────
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (body && typeof body === 'object') {
      // If already wrapped or swagger/health-check, don't wrap again
      if (body.success !== undefined || body.swagger || body.openapi || req.path === '/' || req.path.startsWith('/api-docs')) {
        return originalJson.call(this, body);
      }
      
      // If it looks like an error thrown by controllers
      if (res.statusCode >= 400) {
        return originalJson.call(this, {
          success: false,
          message: body.message || 'An error occurred',
          error: body.error || body,
        });
      }

      // Standard success wrapper
      return originalJson.call(this, {
        success: true,
        data: body,
      });
    }
    return originalJson.call(this, body);
  };
  next();
});

// ─────────────────────────────────────────
// Swagger UI — interactive API docs
// Available at: GET /api-docs
// ─────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─────────────────────────────────────────
// Route imports
// ─────────────────────────────────────────
import authRoutes          from './modules/auth/auth.routes';
import organizationRoutes  from './modules/organizations/organization.routes';
import userRoutes          from './modules/users/user.routes';
import locationRoutes      from './modules/locations/location.routes';
import departmentRoutes    from './modules/departments/department.routes';
import serviceRoutes       from './modules/services/service.routes';
import practitionerRoutes  from './modules/practitioners/practitioner.routes';
import scheduleRoutes      from './modules/schedules/schedule.routes';
import patientRoutes       from './modules/patients/patient.routes';
import checkInRoutes       from './modules/check-ins/checkIn.routes';
import appointmentRoutes   from './modules/appointments/appointment.routes';
import queueRoutes         from './modules/queues/queue.routes';
import visitRoutes         from './modules/visits/visit.routes';
import analyticsRoutes     from './modules/analytics/analytics.routes';

// ─────────────────────────────────────────
// API routes — grouped by domain
// Follows docs/phase-1-architecture.md §25 module structure
//
// RBAC summary:
//   POST /auth/register — public
//   POST /auth/login    — public
//   GET  /auth/me       — any authenticated user
//
//   /organizations      — PLATFORM_ADMIN only
//   /users              — PLATFORM_ADMIN | ORG_ADMIN
//   /locations          — read: all org members | write: ORG_ADMIN+
//   /departments        — read: all org members | write: ORG_ADMIN+
//   /services           — read: all org members | write: ORG_ADMIN+
//   /practitioners      — read: all org members | write: ORG_ADMIN+
//   /schedules          — read: all org members | write: ORG_ADMIN+
//   /patients           — RECEPTIONIST | ORG_ADMIN | PATIENT (self)
//   /check-ins          — RECEPTIONIST | ORG_ADMIN | PATIENT (self)
//   /appointments       — RECEPTIONIST | ORG_ADMIN | PATIENT | PRACTITIONER
//   /queues             — RECEPTIONIST | ORG_ADMIN | PRACTITIONER | PATIENT
//   /visits             — RECEPTIONIST | ORG_ADMIN | PRACTITIONER | PATIENT
//   /analytics          — ORG_ADMIN | PLATFORM_ADMIN
// ─────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/locations',     locationRoutes);
app.use('/api/departments',   departmentRoutes);
app.use('/api/services',      serviceRoutes);
app.use('/api/practitioners', practitionerRoutes);
app.use('/api/schedules',     scheduleRoutes);
app.use('/api/patients',      patientRoutes);
app.use('/api/check-ins',     checkInRoutes);
app.use('/api/appointments',  appointmentRoutes);
app.use('/api/queues',        queueRoutes);
app.use('/api/visits',        visitRoutes);
app.use('/api/analytics',     analyticsRoutes);

// ─────────────────────────────────────────
// Health check
// ─────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    service: 'Care-Queue Backend API',
    status:  'running',
    docs:    `/api-docs`,
    version: '1.0.0',
  });
});

// ─────────────────────────────────────────
// Boot
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅  Care-Queue API running on port ${PORT}`);
    console.log(`📖  Swagger docs → http://localhost:${PORT}/api-docs`);
  });
}).catch((err) => {
  console.error('❌  Database connection failed:', err);
  process.exit(1);
});
