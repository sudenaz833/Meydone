import { User } from '../models/User.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { Favorite } from '../models/Favorite.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const ensureFriendFeatureEnabled = (user) => {
  const role = String(user?.role ?? '');
  if (role === 'admin' || role === 'owner') {
    throw new AppError('Bu hesap tipinde arkadaşlık özelliği kapalıdır.', 403);
  }
};

export const listPendingFriendRequests = asyncHandler(async (req, res) => {
  ensureFriendFeatureEnabled(req.user);
  const me = req.user._id;

  const [incoming, outgoing] = await Promise.all([
    FriendRequest.find({ to: me, status: 'pending' })
      .populate('from', 'name username')
      .sort({ createdAt: -1 })
      .lean(),
    FriendRequest.find({ from: me, status: 'pending' })
      .populate('to', 'name username')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  res.json({
    success: true,
    data: {
      incoming,
      outgoing,
    },
  });
});

export const listFriends = asyncHandler(async (req, res) => {
  ensureFriendFeatureEnabled(req.user);
  const me = req.user._id;

  const requests = await FriendRequest.find({
    status: 'accepted',
    $or: [{ from: me }, { to: me }],
  })
    .populate('from', 'name username profileVisibility role')
    .populate('to', 'name username profileVisibility role')
    .sort({ updatedAt: -1 })
    .lean();

  const friends = requests.map((r) => {
    const fromId = r.from?._id ?? r.from;
    const isFromMe = String(fromId) === String(me);
    const friend = isFromMe ? r.to : r.from;
    return {
      friendshipId: r._id,
      friend,
      friendsSince: r.updatedAt,
    };
  });

  res.json({
    success: true,
    data: { count: friends.length, friends },
  });
});

export const sendFriendRequest = asyncHandler(async (req, res) => {
  const usernameRaw = String(req.body.username ?? '')
    .trim()
    .toLowerCase();
  const friendIdRaw = String(req.body.friendId ?? '').trim();
  const fromUserId = req.user._id;
  const fromUserRole = String(req.user?.role ?? '');

  if (fromUserRole === 'admin' || fromUserRole === 'owner') {
    throw new AppError('Bu hesap tipi arkadaşlık isteği gönderemez.', 403);
  }

  if (!usernameRaw && !friendIdRaw) {
    throw new AppError('username veya friendId gönderilmelidir.', 400);
  }
  if (usernameRaw && friendIdRaw) {
    throw new AppError('Yalnızca username veya friendId gönderin.', 400);
  }

  let target;
  if (friendIdRaw) {
    target = await User.findById(friendIdRaw).select('_id role username');
  } else {
    target = await User.findOne({ username: usernameRaw }).select('_id role');
  }
  if (!target) {
    throw new AppError('User not found', 404);
  }
  if (['admin', 'owner'].includes(String(target.role ?? ''))) {
    throw new AppError('Bu hesaba arkadaşlık isteği gönderilemez.', 403);
  }
  const toUserId = target._id;
  if (String(toUserId) === String(fromUserId)) {
    throw new AppError('You cannot send a friend request to yourself.', 400);
  }

  const alreadyFriends = await FriendRequest.findOne({
    $or: [
      { from: fromUserId, to: toUserId, status: 'accepted' },
      { from: toUserId, to: fromUserId, status: 'accepted' },
    ],
  });
  if (alreadyFriends) {
    throw new AppError('You are already friends with this user.', 409);
  }

  const incomingPending = await FriendRequest.findOne({
    from: toUserId,
    to: fromUserId,
    status: 'pending',
  });
  if (incomingPending) {
    throw new AppError('This user has already sent you a friend request.', 409);
  }

  const outgoing = await FriendRequest.findOne({
    from: fromUserId,
    to: toUserId,
  });

  if (outgoing) {
    if (outgoing.status === 'pending') {
      throw new AppError('Friend request already sent.', 409);
    }
    outgoing.status = 'pending';
    await outgoing.save();
    const populated = await FriendRequest.findById(outgoing._id)
      .populate('from', 'name username')
      .populate('to', 'name username');
    return res.status(201).json({ success: true, data: { request: populated } });
  }

  const request = await FriendRequest.create({
    from: fromUserId,
    to: toUserId,
    status: 'pending',
  });

  const populated = await FriendRequest.findById(request._id)
    .populate('from', 'name username')
    .populate('to', 'name username');

  res.status(201).json({ success: true, data: { request: populated } });
});

export const respondToFriendRequest = asyncHandler(async (req, res) => {
  ensureFriendFeatureEnabled(req.user);
  const action = String(req.body?.action ?? 'accept').trim().toLowerCase();

  const request = await FriendRequest.findById(req.params.id);
  if (!request) {
    throw new AppError('Friend request not found', 404);
  }
  if (!request.to.equals(req.user._id)) {
    throw new AppError('Only the recipient can respond to this request.', 403);
  }
  if (request.status !== 'pending') {
    throw new AppError('This request is no longer pending.', 400);
  }

  if (!['accept', 'reject'].includes(action)) {
    throw new AppError('action must be "accept" or "reject".', 400);
  }

  if (action === 'accept') {
    request.status = 'accepted';
  } else {
    request.status = 'declined';
  }
  await request.save();

  const populated = await FriendRequest.findById(request._id)
    .populate('from', 'name username')
    .populate('to', 'name username');

  res.json({
    success: true,
    data: {
      request: populated,
      outcome: action === 'accept' ? 'accepted' : 'rejected',
    },
  });
});

export const removeFriend = asyncHandler(async (req, res) => {
  ensureFriendFeatureEnabled(req.user);
  const friendUserId = req.params.id;
  const me = req.user._id;

  if (String(friendUserId) === String(me)) {
    throw new AppError('You cannot remove yourself as a friend.', 400);
  }

  const accepted = await FriendRequest.findOneAndDelete({
    status: 'accepted',
    $or: [
      { from: me, to: friendUserId },
      { from: friendUserId, to: me },
    ],
  });

  if (accepted) {
    return res.status(204).send();
  }

  const pending = await FriendRequest.findOneAndDelete({
    status: 'pending',
    $or: [
      { from: me, to: friendUserId },
      { from: friendUserId, to: me },
    ],
  });

  if (!pending) {
    throw new AppError('Friend not found or you are not friends with this user.', 404);
  }

  res.status(204).send();
});

export const getFriendProfile = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const friendId = req.params.id;

  if (String(friendId) === String(me)) {
    throw new AppError('Kendi profiliniz için /profile sayfasını kullanın.', 400);
  }

  const relation = await FriendRequest.findOne({
    status: 'accepted',
    $or: [
      { from: me, to: friendId },
      { from: friendId, to: me },
    ],
  }).lean();

  const friend = await User.findById(friendId)
    .select(
      'name surname username profilePhoto role profileVisibility commentVisibility postsVisibility locationVisibility lastLocationLat lastLocationLng lastLocationAt',
    )
    .lean();
  if (!friend) {
    throw new AppError('User not found', 404);
  }

  if (String(friend.role ?? '') === 'owner') {
    throw new AppError('Mekan sahibi profilleri görüntülenemez.', 403);
  }

  const isFriend = !!relation;
  const profileVisibility = String(friend.profileVisibility || 'public');
  const commentVisibility = String(friend.commentVisibility || 'friends_only');
  const postsVisibility = String(friend.postsVisibility || 'friends_only');

  const canSeeProfile =
    profileVisibility === 'public' ||
    (profileVisibility === 'friends_only' && isFriend);
  const canSeeComments =
    commentVisibility === 'public' ||
    (commentVisibility === 'friends_only' && isFriend);

  const canSeePosts = postsVisibility === 'public' || (postsVisibility === 'friends_only' && isFriend);

  const locationVisibility = String(friend.locationVisibility || 'friends_only');
  const hasStoredLocation =
    friend.lastLocationLat != null &&
    friend.lastLocationLng != null &&
    Number.isFinite(Number(friend.lastLocationLat)) &&
    Number.isFinite(Number(friend.lastLocationLng));
  const canSeeLocation =
    isFriend && locationVisibility !== 'private' && hasStoredLocation;

  if (!canSeeProfile) {
    throw new AppError('Bu kullanıcının profili görünür değil.', 403);
  }

  const [favoriteRows, postsRaw] = await Promise.all([
    Favorite.find({ user: friendId })
      .populate('venue', 'name category photoUrl rating')
      .sort({ createdAt: -1 })
      .lean(),
    canSeePosts
      ? Post.find({ user: friendId })
          .sort({ createdAt: -1 })
          .select('text photoUrl createdAt locationLat locationLng')
          .lean()
      : Promise.resolve([]),
  ]);

  const comments = canSeeComments
    ? await Comment.find({ user: friendId })
      .populate('venue', 'name category')
      .sort({ createdAt: -1 })
      .select('text photoUrl createdAt venue')
      .lean()
    : [];

  const favorites = favoriteRows
    .map((row) => row?.venue)
    .filter(Boolean);

  const posts = postsRaw.map((p) => {
    if (isFriend) return p;
    const { locationLat, locationLng, ...rest } = p;
    return rest;
  });

  const {
    lastLocationLat,
    lastLocationLng,
    lastLocationAt,
    ...friendPublic
  } = friend;

  const sharedLocation = canSeeLocation
    ? {
        lat: Number(lastLocationLat),
        lng: Number(lastLocationLng),
        updatedAt: lastLocationAt ?? null,
      }
    : null;

  res.json({
    success: true,
    data: {
      user: friendPublic,
      favorites,
      posts,
      comments,
      friendsSince: relation?.updatedAt ?? null,
      canSeeComments,
      canSeePosts,
      canSeeLocation,
      sharedLocation,
    },
  });
});
