/**
 * One-time: create an admin user from env or CLI args.
 * Usage: node scripts/createAdmin.js
 * Requires .env with MONGO_URL (or MONGODB_URI), JWT_SECRET and optional ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';

const main = async () => {
  await mongoose.connect(env.mongodbUri);

  const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  const name = process.env.ADMIN_NAME ?? 'Admin';
  const surname = process.env.ADMIN_SURNAME ?? 'User';
  const username = (process.env.ADMIN_USERNAME ?? 'admin').toLowerCase();
  const birthDate = new Date(process.env.ADMIN_BIRTH_DATE ?? '1990-01-01');

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin email already exists:', email);
    process.exit(0);
  }

  await User.create({
    name,
    surname,
    email,
    username,
    password,
    birthDate,
    role: 'admin',
  });
  console.log('Admin created:', email);
  process.exit(0);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
