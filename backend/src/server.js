"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
dotenv_1.default.config();
const app = (0, express_1.default)();
// ─────────────────────────────────────────
// Security middleware
// ─────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// ─────────────────────────────────────────
// Route imports
// ─────────────────────────────────────────
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const organization_routes_1 = __importDefault(require("./modules/organizations/organization.routes"));
const user_routes_1 = __importDefault(require("./modules/users/user.routes"));
const location_routes_1 = __importDefault(require("./modules/locations/location.routes"));
const department_routes_1 = __importDefault(require("./modules/departments/department.routes"));
const service_routes_1 = __importDefault(require("./modules/services/service.routes"));
const practitioner_routes_1 = __importDefault(require("./modules/practitioners/practitioner.routes"));
const schedule_routes_1 = __importDefault(require("./modules/schedules/schedule.routes"));
const patient_routes_1 = __importDefault(require("./modules/patients/patient.routes"));
const checkIn_routes_1 = __importDefault(require("./modules/check-ins/checkIn.routes"));
const appointment_routes_1 = __importDefault(require("./modules/appointments/appointment.routes"));
const queue_routes_1 = __importDefault(require("./modules/queues/queue.routes"));
const visit_routes_1 = __importDefault(require("./modules/visits/visit.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
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
app.use('/api/auth', auth_routes_1.default);
app.use('/api/organizations', organization_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/locations', location_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/services', service_routes_1.default);
app.use('/api/practitioners', practitioner_routes_1.default);
app.use('/api/schedules', schedule_routes_1.default);
app.use('/api/patients', patient_routes_1.default);
app.use('/api/check-ins', checkIn_routes_1.default);
app.use('/api/appointments', appointment_routes_1.default);
app.use('/api/queues', queue_routes_1.default);
app.use('/api/visits', visit_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
// ─────────────────────────────────────────
// Health check
// ─────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({
        service: 'Care-Queue Backend API',
        status: 'running',
        docs: `/api-docs`,
        version: '1.0.0',
    });
});
// ─────────────────────────────────────────
// Boot
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
(0, db_1.default)().then(() => {
    app.listen(PORT, () => {
        console.log(`✅  Care-Queue API running on port ${PORT}`);
        console.log(`📖  Swagger docs → http://localhost:${PORT}/api-docs`);
    });
}).catch((err) => {
    console.error('❌  Database connection failed:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map