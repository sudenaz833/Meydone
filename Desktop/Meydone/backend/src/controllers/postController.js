import { Post } from '../models/Post.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

function sanitizeFeedUser(user) {
  if (!user || typeof user !== 'object') return user;
  const { postsVisibility: _p, ...rest } = user;
  return rest;
}

export const listMyPosts = asyncHandler(async (req, res) => {
  const items = await Post.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('user', 'name surname username profilePhoto')
    .lean();
  res.json({ success: true, data: { items } });
});

/** Arkadaşlar + kendi paylaşımların; gönderi gizliliği (postsVisibility) uygulanır. */
export const listFriendsFeedPosts = asyncHandler(async (req, res) => {
  const role = String(req.user?.role ?? '');
  if (role === 'admin' || role === 'owner') {
    return res.json({ success: true, data: { items: [] } });
  }

  const me = req.user._id;
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));

  const accepted = await FriendRequest.find({
    status: 'accepted',
    $or: [{ from: me }, { to: me }],
  })
    .select('from to')
    .lean();

  const friendObjectIds = [];
  for (const r of accepted) {
    const other = String(r.from) === String(me) ? r.to : r.from;
    friendObjectIds.push(other);
  }

  const authorIds = [...new Map([...friendObjectIds, me].map((id) => [String(id), id])).values()];

  const rawPosts = await Post.find({ user: { $in: authorIds } })
    .sort({ createdAt: -1 })
    .limit(Math.min(200, limit * 6))
    .populate('user', 'name surname username profilePhoto postsVisibility')
    .lean();

  const filtered = [];
  for (const post of rawPosts) {
    const author = post.user;
    const authorId = String(author?._id ?? author);
    const isMine = authorId === String(me);
    if (!isMine) {
      const vis = String(author?.postsVisibility ?? 'friends_only');
      if (vis === 'private') continue;
    }
    filtered.push({ ...post, user: sanitizeFeedUser(author) });
    if (filtered.length >= limit) break;
  }

  res.json({ success: true, data: { items: filtered } });
});

function parseOptionalPostLocation(body) {
  const rawLat = body?.lat;
  const rawLng = body?.lng;
  const hasLat =
    rawLat !== undefined && rawLat !== null && String(rawLat).trim() !== '';
  const hasLng =
    rawLng !== undefined && rawLng !== null && String(rawLng).trim() !== '';
  if (!hasLat && !hasLng) {
    return { locationLat: null, locationLng: null };
  }
  if (!hasLat || !hasLng) {
    throw new AppError('Konum için hem lat hem lng gönderilmelidir.', 400);
  }
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new AppError('Geçersiz konum değerleri.', 400);
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new AppError('Enlem veya boylam aralığı geçersiz.', 400);
  }
  return { locationLat: lat, locationLng: lng };
}

export const createPost = asyncHandler(async (req, res) => {
  const text = String(req.body.text ?? '').trim();
  const photoUrlRaw = String(req.body.photoUrl ?? '').trim();
  const { locationLat, locationLng } = parseOptionalPostLocation(req.body);
  const post = await Post.create({
    user: req.user._id,
    text,
    photoUrl: photoUrlRaw || null,
    locationLat,
    locationLng,
  });
  const populated = await Post.findById(post._id).populate('user', 'name surname username profilePhoto');
  res.status(201).json({ success: true, data: { post: populated } });
});

export const deleteMyPost = asyncHandler(async (req, res) => {
  const deleted = await Post.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Paylaşım bulunamadı' });
  }
  res.status(204).send();
});
