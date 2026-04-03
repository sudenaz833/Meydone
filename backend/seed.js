/**
 * MongoDB seed script — run from project root:
 *   npm run seed
 *
 * Requires MONGO_URL or MONGODB_URI in .env (same as the API).
 * Clears users, venues, comments, friend requests, favorites, and venue ratings, then inserts sample data.
 *
 * Login (plain passwords are hashed by the User model pre-save hook):
 *   user1: user@test.com / 123456
 *   admin: admin@test.com / 123456
 *
 * On server start, empty databases are auto-filled with the same sample data (see src/seed/ensureSampleData.js).
 * To disable: SKIP_AUTO_SEED=true. Full wipe + reseed: run this script.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import { Venue } from './src/models/Venue.js';
import { Comment } from './src/models/Comment.js';
import { FriendRequest } from './src/models/FriendRequest.js';
import { Favorite } from './src/models/Favorite.js';
import { VenueRating } from './src/models/VenueRating.js';
import { venuesWithOwner } from './src/seed/venueSeedData.js';

const MONGODB_URI = (process.env.MONGO_URL || process.env.MONGODB_URI || '').trim();

if (!MONGODB_URI) {
  console.error('Error: MONGO_URL or MONGODB_URI is not set. Add it to your .env file.');
  process.exit(1);
}

/** User schema enforces min length 8 on password; skip validators so test passwords like "123456" still get hashed in pre-save. */
async function createUser(doc) {
  const user = new User(doc);
  await user.save({ validateBeforeSave: false });
  return user;
}

async function clearCollections() {
  await Promise.all([
    Comment.deleteMany({}),
    Favorite.deleteMany({}),
    VenueRating.deleteMany({}),
    FriendRequest.deleteMany({}),
    Venue.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log('Cleared existing seed-related collections.');
}

async function seed() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected\n');

  await clearCollections();

  const user1 = await createUser({
    name: 'Test',
    surname: 'User',
    email: 'user@test.com',
    username: 'user1',
    password: '123456',
    birthDate: new Date('1992-05-20'),
    role: 'user',
  });

  const admin = await createUser({
    name: 'Test',
    surname: 'Admin',
    email: 'admin@test.com',
    username: 'admin_test',
    password: '123456',
    birthDate: new Date('1985-01-10'),
    role: 'admin',
  });

  console.log('Created users (passwords stored as bcrypt hashes):');
  console.log(`  user1 — email: user@test.com  password: 123456  (username: ${user1.username})`);
  console.log(`  admin — email: admin@test.com  password: 123456  (username: ${admin.username})\n`);

  const venueDocs = venuesWithOwner(admin._id);
  const venues = await Venue.insertMany(venueDocs);

  console.log(`Created ${venues.length} venues (owner: ${admin.username}).\n`);

  await Comment.insertMany([
    {
      venue: venues[0]._id,
      user: user1._id,
      rating: 5,
      text: 'Harika meze ve manzara. Kesinlikle tekrar geliriz.',
    },
    {
      venue: venues[0]._id,
      user: admin._id,
      rating: 4,
      text: 'Etler yumuşak, porsiyonlar doyurucu.',
    },
    {
      venue: venues[1]._id,
      user: user1._id,
      rating: 5,
      text: 'Kahve çok dengeli; terasta oturmak keyifli.',
    },
    {
      venue: venues[2]._id,
      user: admin._id,
      rating: 4,
      text: 'Hızlı servis, gece geç saatte kurtarıcı.',
    },
    {
      venue: venues[3]._id,
      user: user1._id,
      rating: 5,
      text: 'Baklava taze ve bol fıstıklı.',
    },
    {
      venue: venues[4]._id,
      user: admin._id,
      rating: 5,
      text: 'Mezeler taze balık için mükemmel eşlik etti.',
    },
    {
      venue: venues[4]._id,
      user: user1._id,
      rating: 4,
      text: 'Rakı balık için güzel bir adres, biraz kalabalık.',
    },
    {
      venue: venues[5]._id,
      user: user1._id,
      rating: 5,
      text: 'Galata manzarası eşliğinde harika espresso.',
    },
    {
      venue: venues[6]._id,
      user: admin._id,
      rating: 4,
      text: 'Smash burger sulu ve lezzetli.',
    },
    {
      venue: venues[7]._id,
      user: user1._id,
      rating: 5,
      text: 'Opera pastayı deneyin, şeker oranı ideal.',
    },
  ]);

  console.log('Created sample comments.\n');

  await FriendRequest.insertMany([
    {
      from: user1._id,
      to: admin._id,
      status: 'accepted',
    },
  ]);

  console.log('Created friend relationships:');
  console.log('  - user1 → admin_test (accepted)\n');

  console.log('Seed completed successfully.');
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('Disconnected.');
  });
