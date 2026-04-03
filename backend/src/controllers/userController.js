import { User } from '../models/User.js';
import { Comment } from '../models/Comment.js';
import { VenueRating } from '../models/VenueRating.js';
import { Favorite } from '../models/Favorite.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;

  const [items, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items, page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json({ success: true, data: { user } });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true },
  ).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ success: true, data: { user } });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.status(204).send();
});

export const deleteUserByIdOrSelf = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const isAdmin = String(req.user?.role ?? '') === 'admin';
  const isSelf = String(id) === String(req.user._id);

  if (!isSelf && !isAdmin) {
    throw new AppError(
      'Bu kaynağa erişmek veya bu işlemi gerçekleştirmek için yeterli yetkiniz bulunmuyor.',
      403,
    );
  }

  if (isSelf) {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    await Comment.deleteMany({ user: user._id });
    await VenueRating.deleteMany({ user: user._id });
    await Favorite.deleteMany({ user: user._id });
    await FriendRequest.deleteMany({
      $or: [{ from: user._id }, { to: user._id }],
    });
    await User.findByIdAndDelete(user._id);
    return res.status(204).send();
  }

  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError('User not found', 404);
  }
  res.status(204).send();
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const {
    name,
    surname,
    firstName,
    lastName,
    phone,
    phoneNumber,
    profilePhoto,
    password,
    currentPassword,
    profileVisibility,
    commentVisibility,
    locationVisibility,
  } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const resolvedName = name !== undefined ? name : firstName;
  const resolvedSurname = surname !== undefined ? surname : lastName;
  const resolvedPhone = phone !== undefined ? phone : phoneNumber;

  if (resolvedName !== undefined) user.name = resolvedName;
  if (resolvedSurname !== undefined) user.surname = resolvedSurname;
  if (resolvedPhone !== undefined) user.phone = resolvedPhone;
  if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
  if (profileVisibility !== undefined) user.profileVisibility = profileVisibility;
  if (commentVisibility !== undefined) user.commentVisibility = commentVisibility;
  if (locationVisibility !== undefined) {
    if (!['public', 'private', 'friends_only'].includes(String(locationVisibility))) {
      throw new AppError('locationVisibility must be public, private, or friends_only.', 400);
    }
    user.locationVisibility = locationVisibility;
  }

  if (password !== undefined) {
    if (!currentPassword) {
      throw new AppError('Current password is required to set a new password.', 400);
    }
    const matches = await user.comparePassword(currentPassword);
    if (!matches) {
      throw new AppError('Current password is incorrect.', 401);
    }
    user.password = password;
  }

  await user.save();
  const safeUser = await User.findById(user._id).select('-password');

  res.json({ success: true, data: { user: safeUser } });
});

const mapOpenApiVisibility = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  if (s === 'friends') return 'friends_only';
  if (['public', 'private', 'friends_only'].includes(s)) return s;
  return s;
};

export const updateProfilePrivacy = asyncHandler(async (req, res) => {
  const {
    profileVisibility,
    commentVisibility,
    postsVisibility,
    postVisibility,
    locationVisibility,
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const locVis = mapOpenApiVisibility(locationVisibility);
  const postVis = mapOpenApiVisibility(postVisibility);
  const postsVis = postVis !== undefined ? postVis : mapOpenApiVisibility(postsVisibility);
  const profVis = mapOpenApiVisibility(profileVisibility);

  if (profVis !== undefined) user.profileVisibility = profVis;
  if (commentVisibility !== undefined) {
    const cv = mapOpenApiVisibility(commentVisibility);
    user.commentVisibility = cv !== undefined ? cv : commentVisibility;
  }
  if (postsVis !== undefined) user.postsVisibility = postsVis;
  if (locVis !== undefined) user.locationVisibility = locVis;
  await user.save();

  const safeUser = await User.findById(user._id).select('-password');

  res.json({ success: true, data: { user: safeUser } });
});

export const updateMyLocation = asyncHandler(async (req, res) => {
  const lat = Number(req.body?.lat);
  const lng = Number(req.body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new AppError('lat ve lng sayısal ve geçerli olmalıdır.', 400);
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new AppError('Geçersiz enlem veya boylam aralığı.', 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.lastLocationLat = lat;
  user.lastLocationLng = lng;
  user.lastLocationAt = new Date();
  await user.save();

  const safeUser = await User.findById(user._id).select('-password');
  res.json({ success: true, data: { user: safeUser } });
});

export const deleteMyAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const providedEmail = String(req.body?.email ?? '')
    .trim()
    .toLowerCase();
  const actualEmail = String(user.email ?? '')
    .trim()
    .toLowerCase();
  if (!providedEmail || providedEmail !== actualEmail) {
    throw new AppError('E-posta dogrulamasi basarisiz. Hesap silinemedi.', 400);
  }

  await Comment.deleteMany({ user: user._id });
  await VenueRating.deleteMany({ user: user._id });
  await Favorite.deleteMany({ user: user._id });
  await FriendRequest.deleteMany({
    $or: [{ from: user._id }, { to: user._id }],
  });
  await User.findByIdAndDelete(user._id);

  res.json({
    success: true,
    message: 'Account and related data deleted successfully.',
  });
});
