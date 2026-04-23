const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../../ayse-app/models/User');
const Venue = require('../../ayse-app/models/Venue');
const Comment = require('../../ayse-app/models/Comment');
const FriendRequest = require('../../ayse-app/models/FriendRequest');

function serverError(res, err) {
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
  return res.status(500).json({ message: 'Sunucu hatası' });
}

/**
 * PUT /friends/accept/:id — body.status: 'accepted' | 'rejected'
 * Sadece request.to; kabulde friends + transaction (MongoDB session).
 */
exports.acceptFriendRequest = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const me = req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Geçersiz talep id' });
    }
    if (status !== 'accepted' && status !== 'rejected') {
      return res.status(400).json({ message: "status 'accepted' veya 'rejected' olmalıdır" });
    }
    if (!mongoose.isValidObjectId(me)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }

    const pre = await FriendRequest.findById(id);
    if (!pre) {
      return res.status(404).json({ message: 'Arkadaşlık talebi bulunamadı' });
    }
    if (String(pre.to) !== String(me)) {
      return res.status(403).json({ message: 'Bu talebi yanıtlama yetkiniz yok' });
    }
    if (pre.status !== 'pending') {
      return res.status(409).json({ message: 'Talep zaten işlenmiş' });
    }

    await session.withTransaction(async () => {
      const request = await FriendRequest.findById(id).session(session);
      if (!request || request.status !== 'pending') {
        throw new Error('TX_CONFLICT');
      }
      if (String(request.to) !== String(me)) {
        throw new Error('TX_FORBIDDEN');
      }
      request.status = status;
      await request.save({ session });
      if (status === 'accepted') {
        await User.findByIdAndUpdate(
          request.from,
          { $addToSet: { friends: request.to } },
          { session }
        );
        await User.findByIdAndUpdate(
          request.to,
          { $addToSet: { friends: request.from } },
          { session }
        );
      }
    });

    const populated = await FriendRequest.findById(id)
      .populate('from', 'name profilePhoto email username')
      .populate('to', 'name profilePhoto email username')
      .lean();

    return res.status(200).json({
      message: status === 'accepted' ? 'Talep kabul edildi' : 'Talep reddedildi',
      data: populated,
    });
  } catch (err) {
    if (err.message === 'TX_CONFLICT') {
      return res.status(409).json({ message: 'Talep eşzamanlı olarak güncellendi' });
    }
    if (err.message === 'TX_FORBIDDEN') {
      return res.status(403).json({ message: 'Bu talebi yanıtlama yetkiniz yok' });
    }
    return serverError(res, err);
  } finally {
    session.endSession();
  }
};

/**
 * DELETE /friends/:id — arkadaşlık kaldırma; $pull + FriendRequest silme; transaction.
 */
exports.deleteFriend = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id: friendUserId } = req.params;
    const me = req.user.id;

    if (!mongoose.isValidObjectId(friendUserId) || !mongoose.isValidObjectId(me)) {
      return res.status(400).json({ message: 'Geçersiz kullanıcı id' });
    }
    if (String(friendUserId) === String(me)) {
      return res.status(400).json({ message: 'Geçersiz işlem' });
    }

    await session.withTransaction(async () => {
      const fr = await FriendRequest.deleteOne(
        {
          status: 'accepted',
          $or: [
            { from: me, to: friendUserId },
            { from: friendUserId, to: me },
          ],
        },
        { session }
      );
      if (fr.deletedCount === 0) {
        throw new Error('NO_FRIENDSHIP');
      }
      const pullMe = await User.findByIdAndUpdate(
        me,
        { $pull: { friends: friendUserId } },
        { session, new: true }
      );
      const pullOther = await User.findByIdAndUpdate(
        friendUserId,
        { $pull: { friends: me } },
        { session, new: true }
      );
      if (!pullMe || !pullOther) {
        throw new Error('TX_USER_MISSING');
      }
    });

    return res.status(200).json({ message: 'Arkadaşlık kaldırıldı' });
  } catch (err) {
    if (err.message === 'NO_FRIENDSHIP') {
      return res.status(404).json({ message: 'Onaylı arkadaşlık kaydı bulunamadı' });
    }
    if (err.message === 'TX_USER_MISSING') {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    return serverError(res, err);
  } finally {
    session.endSession();
  }
};

/**
 * GET /friends — name, profilePhoto, username, email
 * User şemasında `username` alanı tanımlı; yoksa populate listesinden çıkarıp yalnızca email kullanın.
 */
exports.getFriends = async (req, res) => {
  try {
    const me = req.user.id;
    if (!mongoose.isValidObjectId(me)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }

    const user = await User.findById(me)
      .populate('friends', 'name profilePhoto username email')
      .select('friends')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const data = (user.friends || []).map((f) => ({
      userId: f._id,
      name: f.name ?? '',
      profilePhoto: f.profilePhoto ?? '',
      username: f.username ?? '',
      email: f.email ?? '',
    }));

    return res.status(200).json({ message: 'Arkadaşlar', count: data.length, data });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /venues/nearby — 2dsphere + $geoNear; distanceKm (km).
 * geoLocation yoksa mekan listede görünmez (Venue şemasında geoLocation + indeks).
 */
exports.getNearbyVenues = async (req, res) => {
  try {
    const { lat, lng, radiusKm } = req.query;
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (lat === undefined || lng === undefined || lat === '' || lng === '') {
      return res.status(400).json({ message: 'lat ve lng zorunludur' });
    }
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({ message: 'lat ve lng sayısal olmalıdır' });
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Geçersiz koordinat aralığı' });
    }

    let maxKm = radiusKm !== undefined && radiusKm !== '' ? Number(radiusKm) : 50;
    if (Number.isNaN(maxKm) || maxKm <= 0) maxKm = 50;
    const maxMeters = maxKm * 1000;

    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          maxDistance: maxMeters,
          spherical: true,
          key: 'geoLocation',
        },
      },
    ];

    const raw = await Venue.aggregate(pipeline);

    const data = raw.map((v) => {
      const distanceKm = Math.round((v.distance / 1000) * 1000) / 1000;
      const { distance, ...rest } = v;
      return { ...rest, distanceKm };
    });

    return res.status(200).json({ message: 'Yakındaki mekanlar', count: data.length, data });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /venues/map — yalnızca konumu olan mekanlar; venueId, name, lat, lng
 */
exports.getVenuesMap = async (req, res) => {
  try {
    const venues = await Venue.find({
      $or: [
        {
          $and: [
            { 'location.latitude': { $ne: null } },
            { 'location.longitude': { $ne: null } },
          ],
        },
        { 'geoLocation.coordinates.0': { $exists: true } },
      ],
    })
      .select({ name: 1, location: 1, geoLocation: 1 })
      .lean();

    const data = venues
      .map((v) => {
        const lat =
          v.location?.latitude != null
            ? v.location.latitude
            : v.geoLocation?.coordinates?.[1] ?? null;
        const lng =
          v.location?.longitude != null
            ? v.location.longitude
            : v.geoLocation?.coordinates?.[0] ?? null;
        if (lat == null || lng == null) return null;
        return {
          venueId: v._id,
          name: v.name ?? '',
          latitude: lat,
          longitude: lng,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ message: 'Harita verisi', count: data.length, data });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /users/privacy — sadece giriş yapan kullanıcı (JWT); locationVisibility + postVisibility
 */
exports.updatePrivacy = async (req, res) => {
  try {
    const me = req.user.id;
    const { locationVisibility, postVisibility } = req.body;
    const allowed = ['public', 'friends', 'private'];

    if (!mongoose.isValidObjectId(me)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }
    if (!allowed.includes(locationVisibility) || !allowed.includes(postVisibility)) {
      return res.status(400).json({
        message: "locationVisibility ve postVisibility: 'public' | 'friends' | 'private'",
      });
    }

    const user = await User.findByIdAndUpdate(
      me,
      {
        $set: {
          'privacy.locationVisibility': locationVisibility,
          'privacy.postVisibility': postVisibility,
        },
      },
      { new: true, runValidators: true }
    )
      .select('privacy name email')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    return res.status(200).json({ message: 'Gizlilik güncellendi', data: user });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /comments/:id/like — $addToSet likedBy; likes = likedBy uzunluğu (pipeline)
 */
exports.likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const me = req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Geçersiz yorum id' });
    }
    if (!mongoose.isValidObjectId(me)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }

    const userOid = new mongoose.Types.ObjectId(me);

    const updated = await Comment.findOneAndUpdate(
      { _id: id, likedBy: { $nin: [userOid] } },
      [
        {
          $set: {
            likedBy: { $setUnion: [{ $ifNull: ['$likedBy', []] }, [userOid]] },
          },
        },
        { $set: { likes: { $size: '$likedBy' } } },
      ],
      { new: true }
    ).lean();

    if (!updated) {
      const exists = await Comment.findById(id).lean();
      if (!exists) return res.status(404).json({ message: 'Yorum bulunamadı' });
      return res.status(200).json({
        message: 'Bu yorumu zaten beğendiniz',
        data: exists,
        alreadyLiked: true,
      });
    }

    return res.status(200).json({
      message: 'Beğeni kaydedildi',
      data: updated,
      alreadyLiked: false,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /admin/venues/:id/photo — Multer ile dosya; path /uploads/... ; admin route’ta zaten kontrol var.
 */
exports.uploadVenuePhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {
          /* ignore */
        }
      }
      return res.status(400).json({ message: 'Geçersiz mekan id' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Fotoğraf dosyası gerekli (alan adı: photo)' });
    }

    const publicPath = `/uploads/${path.basename(req.file.path)}`;

    const venue = await Venue.findByIdAndUpdate(
      id,
      { $push: { photos: publicPath } },
      { new: true, runValidators: true }
    ).lean();

    if (!venue) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        /* ignore */
      }
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }

    return res.status(200).json({ message: 'Fotoğraf yüklendi', data: venue });
  } catch (err) {
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        /* ignore */
      }
    }
    return serverError(res, err);
  }
};
