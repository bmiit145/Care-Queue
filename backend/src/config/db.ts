import mongoose from 'mongoose';
import { env } from './env';

const connectDB = async (): Promise<void> => {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
    minPoolSize: 2,
  });

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
};

export default connectDB;
