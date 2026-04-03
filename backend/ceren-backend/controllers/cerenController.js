const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../ayse-app/models/User');
const Venue = require('../../ayse-app/models/Venue');
const Comment = require('../../ayse-app/models/Comment');

function serverError(res, err) {
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
  return res.status(500).json({ message: 'Sunucu hatası' });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * POST /auth/login — email veya username + şifre (bcrypt)
 */
exports.login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Şifre zorunludur' });
    }
    if (!email && (username === undefined || username === null || String(username).trim() === '')) {
      return res.status(400).json({ message: 'email veya username zorunludur' });
    }

    let user;
    if (email != null && String(email).trim() !== '') {
      user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    } else {
      const u = String(username).trim();
      if (!u) {
        return res.status(400).json({ message: 'Geçerli username gerekli' });
      }
      user = await User.findOne({ username: u }).select('+password');
    }

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Sunucu yapılandırması eksik (JWT_SECRET)' });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
      { id: String(user._id), role: user.role },
      secret,
      { expiresIn }
    );

    const safe = await User.findById(user._id).select('-password').lean();

    return res.status(200).json({
      message: 'Giriş başarılı',
      token,
      data: safe,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /auth/register — email + username + password (+ ad, soyad, doğum tarihi)
 */
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, birthDate, email, username, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email ve password zorunludur' });
    }
    if (username === undefined || username === null || String(username).trim() === '') {
      return res.status(400).json({ message: 'username zorunludur ve boş olamaz' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Şifre en az 8 karakter olmalıdır' });
    }

    const usernameNorm = String(username).trim();
    const emailNorm = String(email).toLowerCase().trim();

    const emailTaken = await User.findOne({ email: emailNorm }).lean();
    if (emailTaken) {
      return res.status(409).json({ message: 'Bu e-posta ile kayıt zaten var' });
    }

    const usernameTaken = await User.findOne({ username: usernameNorm }).lean();
    if (usernameTaken) {
      return res.status(409).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    let bd = null;
    if (birthDate != null && birthDate !== '') {
      bd = new Date(birthDate);
      if (Number.isNaN(bd.getTime())) {
        return res.status(400).json({ message: 'Geçersiz doğum tarihi' });
      }
    }

    const hashed = await User.hashPassword(password);
    const fn = firstName != null ? String(firstName).trim() : '';
    const ln = lastName != null ? String(lastName).trim() : '';

    const user = await User.create({
      email: emailNorm,
      username: usernameNorm,
      password: hashed,
      firstName: fn,
      lastName: ln,
      name: [fn, ln].filter(Boolean).join(' ').trim(),
      birthDate: bd,
      role: 'user',
    });

    const safe = await User.findById(user._id).select('-password').lean();

    return res.status(201).json({
      message: 'Kayıt oluşturuldu',
      data: safe,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /comments — restoran (venue) yorumu
 */
exports.createComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, venueId } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }
    if (!venueId || !mongoose.isValidObjectId(venueId)) {
      return res.status(400).json({ message: 'Geçerli venueId zorunludur' });
    }

    const venue = await Venue.findById(venueId).lean();
    if (!venue) {
      return res.status(404).json({ message: 'Mekan bulunamadı' });
    }

    const text = content != null ? String(content).trim() : '';
    if (!text) {
      return res.status(400).json({ message: 'Yorum içeriği (content) zorunludur' });
    }

    const comment = await Comment.create({
      author: userId,
      venue: venueId,
      content: text,
      photos: [],
    });

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name firstName lastName email username')
      .populate('venue', 'name category')
      .lean();

    return res.status(201).json({ message: 'Yorum oluşturuldu', data: populated });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /comments/:id/photo — yoruma fotoğraf URL ekle
 */
exports.addCommentPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { photoUrl } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Geçersiz yorum id' });
    }
    if (!photoUrl || typeof photoUrl !== 'string' || !photoUrl.trim()) {
      return res.status(400).json({ message: 'photoUrl zorunludur' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }
    if (String(comment.author) !== String(userId)) {
      return res.status(403).json({ message: 'Bu yoruma fotoğraf ekleme yetkiniz yok' });
    }

    comment.photos = comment.photos || [];
    comment.photos.push(photoUrl.trim());
    await comment.save();

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name username')
      .populate('venue', 'name')
      .lean();

    return res.status(200).json({ message: 'Fotoğraf eklendi', data: populated });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * DELETE /comments/:id — yalnızca yorum sahibi
 */
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Geçersiz yorum id' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }
    if (String(comment.author) !== String(userId)) {
      return res.status(403).json({ message: 'Bu yorumu silme yetkiniz yok' });
    }

    await Comment.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Yorum silindi' });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /comments/:id — içerik güncelle; yalnızca yazar
 */
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Geçersiz yorum id' });
    }

    const text = content != null ? String(content).trim() : '';
    if (!text) {
      return res.status(400).json({ message: 'content zorunludur' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }
    if (String(comment.author) !== String(userId)) {
      return res.status(403).json({ message: 'Bu yorumu güncelleme yetkiniz yok' });
    }

    comment.content = text;
    await comment.save();

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name username')
      .populate('venue', 'name')
      .lean();

    return res.status(200).json({ message: 'Yorum güncellendi', data: populated });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /venues/search?name= — isimde kısmi eşleşme (regex, case-insensitive)
 */
exports.searchVenues = async (req, res) => {
  try {
    const name = req.query.name;

    if (name === undefined || name === null || String(name).trim() === '') {
      return res.status(400).json({ message: 'Query parametresi name zorunludur' });
    }

    const q = String(name).trim();
    const venues = await Venue.find({
      name: new RegExp(escapeRegex(q), 'i'),
    }).lean();

    return res.status(200).json({
      message: 'Arama sonucu',
      count: venues.length,
      data: venues,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /venues/filter?category= — kategoriye göre filtre (büyük/küçük harf duyarsız tam eşleşme)
 */
exports.filterVenues = async (req, res) => {
  try {
    const category = req.query.category;

    if (category === undefined || category === null || String(category).trim() === '') {
      return res.status(400).json({ message: 'Query parametresi category zorunludur' });
    }

    const cat = String(category).trim();
    const venues = await Venue.find({
      category: new RegExp(`^${escapeRegex(cat)}$`, 'i'),
    }).lean();

    return res.status(200).json({
      message: 'Filtre sonucu',
      count: venues.length,
      data: venues,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /notifications/comment-likes — kullanıcının yorumlarına gelen beğeniler
 */
exports.getCommentLikeNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: 'Geçersiz oturum' });
    }

    const comments = await Comment.find({
      author: userId,
      'likedBy.0': { $exists: true },
    })
      .populate('likedBy', 'name username profilePhoto email')
      .populate('venue', 'name')
      .sort({ updatedAt: -1 })
      .lean();

    const notifications = comments.map((c) => {
      const likersRaw = c.likedBy || [];
      const likers = likersRaw.map((liker) => ({
        userId: liker._id,
        name: liker.name ?? '',
        username: liker.username ?? '',
        profilePhoto: liker.profilePhoto ?? '',
      }));
      const likesCount = typeof c.likes === 'number' ? c.likes : likers.length;
      return {
        type: 'comment_like',
        commentId: c._id,
        venue: c.venue,
        likesCount,
        likers,
      };
    });

    return res.status(200).json({
      message: 'Yorum beğeni bildirimleri',
      count: notifications.length,
      data: notifications,
    });
  } catch (err) {
    return serverError(res, err);
  }
};
