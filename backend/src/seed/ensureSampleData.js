import { User } from '../models/User.js';
import { Venue } from '../models/Venue.js';
import { Comment } from '../models/Comment.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { venueSeedDocuments, venuesWithOwner } from './venueSeedData.js';
import { normalizeVenueMenu } from '../utils/venueMenu.js';

/** User schema enforces min password length; skip validators so demo password hashes correctly. */
async function createUser(doc) {
  const user = new User(doc);
  await user.save({ validateBeforeSave: false });
  return user;
}

function commentDocs(venues, user1Id, adminId) {
  return [
    { venue: venues[0]._id, user: user1Id, rating: 5, text: 'Mezeler taze ve deniz ürünleri çok lezzetli. Kesinlikle tekrar geliriz.' },
    { venue: venues[0]._id, user: adminId, rating: 4, text: 'Atmosfer çok sıcak; porsiyonlar doyurucu.' },
    { venue: venues[1]._id, user: user1Id, rating: 5, text: 'Kahve çok dengeli; terasta oturmak keyifli.' },
    { venue: venues[2]._id, user: adminId, rating: 4, text: 'Dürüm hızlı geldi; gece geç saatte gerçekten kurtarıcı.' },
    { venue: venues[3]._id, user: user1Id, rating: 5, text: 'Baklava taze ve bol fıstıklı.' },
    { venue: venues[4]._id, user: adminId, rating: 5, text: 'Mezeler taze balık için mükemmel eşlik etti.' },
    { venue: venues[4]._id, user: user1Id, rating: 4, text: 'Rakı balık için güzel bir adres, biraz kalabalık.' },
    { venue: venues[5]._id, user: user1Id, rating: 5, text: 'Çekirdek kalitesi iyi; espresso yoğun ama dengeli.' },
    { venue: venues[6]._id, user: adminId, rating: 4, text: 'Smash burger sulu ve lezzetli.' },
    { venue: venues[7]._id, user: user1Id, rating: 5, text: 'Opera pastayı deneyin, şeker oranı ideal.' },
  ];
}

/**
 * Idempotent bootstrap: runs on server start.
 * Inserts sample users, venues, comments, and one accepted friend request only when
 * both `users` and `venues` collections are empty — no wipe, no duplicate seeding.
 *
 * Set SKIP_AUTO_SEED=true to disable (e.g. production with managed migrations only).
 */
export async function ensureSampleData() {
  if (process.env.SKIP_AUTO_SEED === 'true' || process.env.SKIP_AUTO_SEED === '1') {
    return { seeded: false, skipped: true, reason: 'SKIP_AUTO_SEED' };
  }

  async function ensureMissingSeedVenues() {
    const owner = await User.findOne({ role: 'admin' }).select('_id');
    const existing = await Venue.find({}).select('name').lean();
    const existingNames = new Set(existing.map((v) => String(v.name ?? '').trim()));
    const missing = venueSeedDocuments.filter((doc) => !existingNames.has(String(doc.name ?? '').trim()));
    if (missing.length === 0) return 0;
    const docs = missing.map((doc) => ({
      ...doc,
      owner: owner?._id ?? null,
      menu: normalizeVenueMenu(doc.menu || []),
    }));
    await Venue.insertMany(docs);
    return docs.length;
  }

  const [userCount, venueCount] = await Promise.all([
    User.countDocuments(),
    Venue.countDocuments(),
  ]);

  if (userCount > 0 || venueCount > 0) {
    const addedVenueCount = await ensureMissingSeedVenues();
    return { seeded: false, skipped: false, reason: 'database_not_empty', addedVenueCount };
  }

  try {
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

    const venueDocs = venuesWithOwner(admin._id).map((d) => ({
      ...d,
      menu: normalizeVenueMenu(d.menu || []),
    }));
    const venues = await Venue.insertMany(venueDocs);

    await Comment.insertMany(commentDocs(venues, user1._id, admin._id));

    await FriendRequest.insertMany([
      {
        from: user1._id,
        to: admin._id,
        status: 'accepted',
      },
    ]);

    const addedVenueCount = await ensureMissingSeedVenues();
    console.log('[seed] Empty database — inserted sample users, venues, comments, and friend request.');
    if (addedVenueCount > 0) {
      console.log(`[seed] Added ${addedVenueCount} missing seed venues.`);
    }
    console.log('[seed] Login: user@test.com / 123456  |  admin@test.com / 123456');
    return { seeded: true, venues: venues.length, skipped: false, addedVenueCount };
  } catch (err) {
    if (err.code === 11000) {
      console.log('[seed] Sample data already exists (duplicate key); skipping auto-seed.');
      return { seeded: false, skipped: true, reason: 'duplicate_key' };
    }
    throw err;
  }
}
