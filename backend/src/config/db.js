import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * MongoDB connection via Mongoose.
 * Connection string comes from the **MONGO_URL** environment variable
 * (see `env.js`; `MONGODB_URI` is supported as a fallback).
 */

mongoose.set('strictQuery', true);

mongoose.connection.on('error', (err) => {
  console.error('MongoDB / Mongoose error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

/**
 * Connects to MongoDB before the HTTP server accepts traffic.
 * Call once during startup (`server.js` → `await connectDB()`).
 */
export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB connected successfully (already connected)');
    return;
  }

  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err?.message || err);
    throw err;
  }
}
