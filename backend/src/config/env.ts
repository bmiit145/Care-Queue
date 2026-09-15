import dotenv from 'dotenv';

dotenv.config();

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV?.trim() || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: required('MONGO_URI'),
  jwtSecret: required('JWT_SECRET'),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
} as const;

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

if (env.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}
