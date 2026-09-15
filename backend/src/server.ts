import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

dotenv.config();

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
import organizationRoutes from './modules/organizations/organization.routes';
import authRoutes from './modules/auth/auth.routes';
import patientRoutes from './modules/patients/patient.routes';
import queueRoutes from './modules/queues/queue.routes';
import appointmentRoutes from './modules/appointments/appointment.routes';
import visitRoutes from './modules/visits/visit.routes';
import scheduleRoutes from './modules/schedules/schedule.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/organizations', organizationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Care-Queue Backend API is running');
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
}).catch(err => {
  console.error('Failed to connect to the database', err);
});
