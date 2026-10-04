import mongoose from 'mongoose';
import { env } from './env';

let connectionPromise: Promise<void> | null = null;

const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;
  if (connectionPromise) return connectionPromise;

  mongoose.set('strictQuery', true);

  connectionPromise = mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5_000,
    connectTimeoutMS: 5_000,
    maxPoolSize: 20,
    minPoolSize: 2,
  }).then(() => undefined).finally(() => {
    connectionPromise = null;
  });

  await connectionPromise;
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
};

export interface DatabaseHealth {
  status: 'up' | 'down';
  latencyMs: number | null;
  error?: string;
}

export const getDatabaseHealth = async (): Promise<DatabaseHealth> => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return { status: 'down', latencyMs: null, error: 'Database connection is not ready' };
  }

  const startedAt = Date.now();
  try {
    await mongoose.connection.db.admin().ping();
    return { status: 'up', latencyMs: Date.now() - startedAt };
  } catch {
    return { status: 'down', latencyMs: Date.now() - startedAt, error: 'Database health check failed' };
  }
};

export default connectDB;
