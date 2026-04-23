import mongoose from 'mongoose';
import User from '../../ayse-app/models/User.js';
import Venue from '../../ayse-app/models/Venue.js';
import Rating from '../../ayse-app/models/Rating.js';
import Post from '../../ayse-app/models/Post.js';
import FriendRequest from '../../ayse-app/models/FriendRequest.js';

function serverError(res, err) {
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
  return res.status(500).json({ message: 'Sunucu hatası' });
}

/**
 * DELETE /admin/venues/:venuesId
 */
export const deleteVenue = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { venuesId } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(venuesId)) {
      return res.status(400).json({ message: 'Geçersiz mekan id' });
    }
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }

    await session.withTransaction(async () => {
      const venue = await Venue.findById(venuesId).session(session);
      if (!venue) {
        throw new Error('NOT_FOUND');
      }
      if (!venue.owner || String(venue.owner) !== String(userId)) {
        throw new Error('FORBIDDEN');
      }

      await User.updateMany(
        { favorites: venuesId },
        { $pull: { favorites: venuesId } },
        { session }
      );
      await Post.deleteMany({ venue: venuesId }, { session });
      await Rating.deleteMany({ venue: venuesId }, { session });
      await Venue.deleteOne({ _id: venuesId }, { session });
    });

    return res.status(200).json({ message: 'Mekan silindi' });
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ message: 'Bu mekanı silme yetkiniz yok' });
    }
    return serverError(res, err);
  } finally {
    session.endSession();
  }
};

function normalizeVenuePhotos(body) {
  const { photoUrl, photos } = body;
  const out = [];
  if (Array.isArray(photos)) {
    for (const p of photos) {
      const s = p != null ? String(p).trim() : '';
      if (s) out.push(s);
    }
  } else if (photos != null && photos !== '') {
    const s = String(photos).trim();
    if (s) out.push(s);
  }
  if (photoUrl != null && String(photoUrl).trim()) {
    out.push(String(photoUrl).trim());
  }
  return [...new Set(out)];
}

/**
 * POST /admin/register
 */
export const adminRegister = async (req, res) => {
  try {
    const {
      email,
      password,
      username,
      firstName,
      lastName,
      venueName,
      opening_hours,
      location,
      menu,
      photoUrl,
      photos,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email ve password zorunludur' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Şifre en az 8 karakter olmalıdır' });
    }

    const exists = await User.findOne({ email: String(email).toLowerCase().trim() }).lean();
    if (exists) {
      return res.status(409).json({ message: 'Bu e-posta ile kayıt zaten var' });
    }

    const venuePayload = {
      name: venueName ?? '',
      opening_hours: opening_hours ?? null,
      menu: menu ?? null,
      photos: normalizeVenuePhotos({ photoUrl, photos }),
    };

    if (location != null && typeof location === 'object') {
      const { latitude: latIn, longitude: lngIn } = location;
      if (latIn === undefined || lngIn === undefined || latIn === '' || lngIn === '') {
        return res.status(400).json({
          message:
            'Konum gönderildiğinde location.latitude ve location.longitude zorunludur ve sayısal olmalıdır',
        });
      }
      const latitude = Number(latIn);
      const longitude = Number(lngIn);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return res.status(400).json({ message: 'latitude ve longitude sayısal olmalıdır' });
      }
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({ message: 'latitude -90 ile +90 arasında olmalıdır' });
      }
      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: 'longitude -180 ile +180 arasında olmalıdır' });
      }
      venuePayload.location = { latitude, longitude };
    }

    const hashed = await User.hashPassword(password);
    const userPayload = {
      email: String(email).toLowerCase().trim(),
      password: hashed,
      firstName: firstName ?? '',
      lastName: lastName ?? '',
      name: [firstName, lastName].filter(Boolean).join(' ').trim(),
      role: 'owner',
    };
    if (username !== undefined && username !== null) {
      userPayload.username = String(username).trim();
    }

    const user = await User.create(userPayload);
    venuePayload.owner = user._id;
    const venue = await Venue.create(venuePayload);

    const safeUser = await User.findById(user._id)
      .select('-password')
      .lean();

    return res.status(201).json({
      message: 'Mekan sahibi ve mekan basarıyla oluşturuldu',
      data: { user: safeUser, venue },
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /venues/:id/rate
 */
export const rateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    let { score } = req.body;
    score = Number(score);

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Geçersiz mekan id' });
    }
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }
    if (!Number.isFinite(score) || !Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Puan 1 ile 5 arasında tam sayı olmalıdır' });
    }

    const venue = await Venue.findById(id).lean();
    if (!venue) {
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }

    const doc = await Rating.findOneAndUpdate(
      { venue: id, user: userId },
      { $set: { score } },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    return res.status(200).json({ message: 'Puan kaydedildi', data: doc });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /venues/:id/average-rating
 */
export const getAverageRating = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Geçersiz mekan id' });
    }

    const venue = await Venue.findById(id).lean();
    if (!venue) {
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }

    const agg = await Rating.aggregate([
      { $match: { venue: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$score' },
          ratingsCount: { $sum: 1 },
        },
      },
    ]);

    const row = agg[0];
    const averageRating = row
      ? Math.round(row.averageRating * 1000) / 1000
      : 0;
    const ratingsCount = row ? row.ratingsCount : 0;

    return res.status(200).json({
      message: 'Ortalama puan',
      data: { venueId: id, averageRating, ratingsCount },
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /venues/sort?by=rating
 */
export const sortVenuesByRating = async (req, res) => {
  try {
    const { by } = req.query;
    if (by !== 'rating') {
      return res.status(400).json({
        message: 'Geçersiz veya eksik parametre: sorgu parametresi by=rating olmalıdır',
      });
    }

    const stats = await Rating.aggregate([
      {
        $group: {
          _id: '$venue',
          averageRating: { $avg: '$score' },
          ratingsCount: { $sum: 1 },
        },
      },
    ]);

    const statMap = new Map(
      stats.map((s) => [
        String(s._id),
        { averageRating: Math.round(s.averageRating * 1000) / 1000, ratingsCount: s.ratingsCount },
      ])
    );

    const venues = await Venue.find().lean();
    const merged = venues
      .map((v) => {
        const s = statMap.get(String(v._id));
        return {
          venueId: v._id,
          name: v.name ?? '',
          averageRating: s?.averageRating ?? 0,
          ratingsCount: s?.ratingsCount ?? 0,
        };
      })
      .sort((a, b) => b.averageRating - a.averageRating);

    return res.status(200).json({
      message: 'Mekanlar puana göre sıralı',
      count: merged.length,
      data: merged,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * DELETE /users/account
 */
export const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const ownedVenueIds = await Venue.find({ owner: userId }).distinct('_id');
    await User.updateMany(
      { favorites: { $in: ownedVenueIds } },
      { $pullAll: { favorites: ownedVenueIds } }
    );

    await Post.deleteMany({ author: userId });
    await Rating.deleteMany({
      $or: [{ user: userId }, { venue: { $in: ownedVenueIds } }],
    });
    await Venue.deleteMany({ owner: userId });
    await FriendRequest.deleteMany({
      $or: [{ from: userId }, { to: userId }],
    });
    await User.updateMany({ friends: userId }, { $pull: { friends: userId } });

    await User.findByIdAndDelete(userId);

    return res.status(200).json({ message: 'Hesap kalıcı olarak silindi' });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /users/profile
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, name, profilePhoto } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }

    const $set = {};
    if (firstName !== undefined) $set.firstName = String(firstName).trim();
    if (lastName !== undefined) $set.lastName = String(lastName).trim();
    if (name !== undefined) $set.name = String(name).trim();
    if (profilePhoto !== undefined) $set.profilePhoto = String(profilePhoto).trim();

    if (Object.keys($set).length === 0) {
      return res.status(400).json({ message: 'Güncellenecek alan yok' });
    }

    if ($set.firstName !== undefined || $set.lastName !== undefined) {
      const current = await User.findById(userId).select('firstName lastName').lean();
      const fn = $set.firstName !== undefined ? $set.firstName : current?.firstName ?? '';
      const ln = $set.lastName !== undefined ? $set.lastName : current?.lastName ?? '';
      const combined = [fn, ln].filter(Boolean).join(' ').trim();
      if (combined && name === undefined) {
        $set.name = combined;
      }
    }

    const updated = await User.findByIdAndUpdate(userId, { $set }, { new: true, runValidators: true })
      .select('-password')
      .lean();

    if (!updated) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    return res.status(200).json({ message: 'Profil güncellendi', data: updated });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /users/posts
 */
export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, imageUrl } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }

    const textStr = text != null ? String(text).trim() : '';
    const imageStr = imageUrl != null ? String(imageUrl).trim() : '';

    if (!textStr && !imageStr) {
      return res.status(400).json({ message: 'text veya imageUrl en az biri dolu olmalıdır' });
    }

    const post = await Post.create({
      author: userId,
      text: textStr,
      imageUrl: imageStr,
    });

    const populated = await Post.findById(post._id).populate('author', 'name firstName lastName email').lean();

    return res.status(201).json({ message: 'Gönderi oluşturuldu', data: populated });
  } catch (err) {
    return serverError(res, err);
  }
};


export default {
  deleteVenue,
  adminRegister,
  rateVenue,
  getAverageRating,
  sortVenuesByRating,
  deleteUserAccount,
  updateUserProfile,
  createPost
};