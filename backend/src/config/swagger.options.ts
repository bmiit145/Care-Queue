import type swaggerJSDoc from 'swagger-jsdoc';

/**
 * Shared swagger-jsdoc configuration.
 *
 * Kept separate from `swagger.ts` so the build-time generator
 * (`scripts/generate-openapi.ts`) can import it without pulling in the
 * generated artifact it is responsible for producing.
 */
export const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Care-Queue API',
      version: '1.0.0',
      description: 'API documentation for Care-Queue Backend (Phase 1)',
    },
    tags: [
      { name: 'Health', description: 'Service health and readiness checks' },
      { name: 'Auth', description: 'Authentication and session management' },
      { name: 'Organizations', description: 'Organization management' },
      { name: 'Users', description: 'User and staff management' },
      { name: 'Locations', description: 'Location management' },
      { name: 'Departments', description: 'Department management' },
      { name: 'Services', description: 'Clinical service management' },
      { name: 'Practitioners', description: 'Practitioner management' },
      { name: 'Schedules', description: 'Practitioner schedule management' },
      { name: 'Patients', description: 'Patient management' },
      { name: 'Check-Ins', description: 'Patient check-in management' },
      { name: 'Appointments', description: 'Appointment management' },
      { name: 'Queues', description: 'Queue management' },
      { name: 'Visits', description: 'Visit management' },
      { name: 'Analytics', description: 'Operational analytics' },
    ],
    // Relative server URL: resolves against whatever origin serves the docs,
    // so "Try it out" works on localhost and on the deployed host alike.
    // Routes are documented without the `/api` prefix they are mounted under.
    servers: [
      {
        url: '/api',
        description: 'Current host',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Only resolvable at build time / in local dev — the compiled serverless
  // bundle has no `src` directory. See `swagger.ts`.
  apis: ['./src/modules/**/*.ts', './src/server.ts'],
};
