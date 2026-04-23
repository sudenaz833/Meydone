const mongoose = require('mongoose');
const Venue = require('../models/Venue');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

function serverError(res, err) {
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
  return res.status(500).json({ message: 'Sunucu hatası' });
}

/**
 * PUT /admin/venues/:id/hours — req.params.id, req.body.opening_hours (admin + JWT)
 */
exports.updateHours = async (req, res) => {
  try {
    const { id } = req.params;
    const { opening_hours } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Geçersiz mekan id' });
    }
    if (opening_hours === undefined || opening_hours === null) {
      return res.status(400).json({ message: 'opening_hours zorunludur' });
    }

    const venue = await Venue.findByIdAndUpdate(
      id,
      { $set: { opening_hours } },
      { new: true, runValidators: true }
    ).lean();

    if (!venue) {
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }

    return res.status(200).json({ message: 'Çalışma saatleri güncellendi', data: venue });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /admin/venues/:id/location — req.params.id, req.body.latitude, req.body.longitude (admin + JWT)
 */
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Geçersiz mekan id' });
    }
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'latitude ve longitude zorunludur' });
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'latitude ve longitude sayısal olmalı' });
    }
    if (lat < -90 || lat > 90) {
      return res.status(400).json({ message: 'latitude -90 ile +90 arasında olmalıdır' });
    }
    if (lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'longitude -180 ile +180 arasında olmalıdır' });
    }

    const venue = await Venue.findByIdAndUpdate(
      id,
      { $set: { 'location.latitude': lat, 'location.longitude': lng } },
      { new: true, runValidators: true }
    ).lean();

    if (!venue) {
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }

    return res.status(200).json({ message: 'Konum güncellendi', data: venue });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /admin/venues/:id/menu — req.params.id, req.body.menu (admin + JWT)
 */
exports.updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { menu } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Geçersiz mekan id' });
    }
    if (menu === undefined || menu === null) {
      return res.status(400).json({ message: 'menu zorunludur' });
    }
    const isObject =
      typeof menu === 'object' && menu !== null && !Array.isArray(menu);
    const isArray = Array.isArray(menu);
    if (!isObject && !isArray) {
      return res.status(400).json({ message: 'menu dizi veya nesne olmalı' });
    }

    const venue = await Venue.findByIdAndUpdate(
      id,
      { $set: { menu } },
      { new: true, runValidators: true }
    ).lean();

    if (!venue) {
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }

    return res.status(200).json({ message: 'Menü güncellendi', data: venue });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /auth/update-password — req.user.id (JWT), req.body: currentPassword, newPassword
 */
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'currentPassword ve newPassword zorunludur',
      });
    }
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ message: 'Yeni şifre en az 8 karakter olmalı' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const ok = await user.comparePassword(currentPassword);
    if (!ok) {
      return res.status(401).json({ message: 'Mevcut şifre hatalı' });
    }

    user.password = await User.hashPassword(newPassword);
    await user.save();

    return res.status(200).json({ message: 'Şifre güncellendi' });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /favorites — req.user.id (JWT), req.body.venueId
 */
exports.addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { venueId } = req.body;

    if (!venueId) {
      return res.status(400).json({ message: 'venueId zorunludur' });
    }
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(venueId)) {
      return res.status(400).json({ message: 'Geçersiz kullanıcı veya mekan id' });
    }

    const venue = await Venue.findById(venueId).lean();
    if (!venue) {
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: venueId } },
      { new: true }
    )
      .select('favorites')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    return res.status(200).json({ message: 'Favorilere eklendi', data: user });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * DELETE /favorites/:venueId — req.user.id (JWT), req.params.venueId (body yok)
 */
exports.deleteFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { venueId } = req.params;

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(venueId)) {
      return res.status(400).json({ message: 'Geçersiz kullanıcı veya mekan id' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { favorites: venueId } },
      { new: true }
    )
      .select('favorites')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    return res.status(200).json({ message: 'Favorilerden çıkarıldı', data: user });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /friends/request — req.user.id gönderen (JWT), req.body.toUserId
 */
exports.sendFriendRequest = async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { toUserId } = req.body;

    if (!toUserId) {
      return res.status(400).json({ message: 'toUserId zorunludur' });
    }
    if (!mongoose.isValidObjectId(fromUserId) || !mongoose.isValidObjectId(toUserId)) {
      return res.status(400).json({ message: 'Geçersiz kullanıcı id' });
    }
    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'Kendinize talep gönderilemez' });
    }

    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId).lean(),
      User.findById(toUserId).lean(),
    ]);
    if (!fromUser || !toUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { from: fromUserId, to: toUserId },
        { from: toUserId, to: fromUserId },
      ],
    }).lean();

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(409).json({ message: 'Zaten arkadaşsınız' });
      }
      if (existing.status === 'pending') {
        return res.status(409).json({ message: 'Zaten bekleyen bir talep var' });
      }
    }

    const doc = await FriendRequest.create({
      from: fromUserId,
      to: toUserId,
      status: 'pending',
    });

    return res.status(201).json({ message: 'Arkadaşlık talebi oluşturuldu', data: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Bu kullanıcı çifti için talep zaten var' });
    }
    return serverError(res, err);
  }
};

/**
 * GET /notifications/friend-requests — req.user.id (JWT), body kullanılmaz
 */
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }

    const requests = await FriendRequest.find({
      to: userId,
      status: 'pending',
    })
      .populate('from', 'email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      message: 'Gelen arkadaşlık talepleri',
      count: requests.length,
      data: requests,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/* -------------------------------------------------------------------------- */
/* Middleware örnekleri (üretimde ayrı dosyalarda: middleware/*.js)           */
/* -------------------------------------------------------------------------- */
/*
const jwt = require('jsonwebtoken');

// authMiddleware — JWT doğrulama
function authMiddleware(req, res, next) {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Giriş gerekli' });
    }
    const token = h.slice(7).trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const id = payload.sub ?? payload.id;
    req.user = { id: String(id), role: payload.role === 'admin' ? 'admin' : 'user' };
    next();
  } catch {
    return res.status(401).json({ message: 'Geçersiz token' });
  }
}

// adminMiddleware — sadece admin
function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Yönetici yetkisi gerekli' });
  }
  next();
}

// Kullanım: router.put('/admin/...', authMiddleware, adminMiddleware, handler);
//           router.put('/auth/update-password', authMiddleware, handler);
*/
