import { Comment } from '../models/Comment.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { Venue } from '../models/Venue.js';
import { Favorite } from '../models/Favorite.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const preview = (text, max = 120) => {
  const t = String(text ?? '');
  return t.length <= max ? t : `${t.slice(0, max)}…`;
};

export const listCommentLikeNotifications = asyncHandler(async (req, res) => {
  const me = req.user._id;

  const comments = await Comment.find({
    user: me,
    'likedBy.0': { $exists: true },
  })
    .populate('likedBy', 'name username')
    .populate('venue', 'name category')
    .sort({ updatedAt: -1 })
    .lean();

  const items = comments
    .map((c) => {
      const likers = (c.likedBy ?? []).filter(
        (u) => String(u._id ?? u) !== String(me),
      );
      return {
        type: 'comment_like',
        commentId: c._id,
        venue: c.venue,
        commentPreview: preview(c.text),
        likers,
        likeCount: likers.length,
        updatedAt: c.updatedAt,
      };
    })
    .filter((row) => row.likeCount > 0);

  res.json({
    success: true,
    data: { count: items.length, items },
  });
});

export const listCommentReplyNotifications = asyncHandler(async (req, res) => {
  const me = req.user._id;

  const comments = await Comment.find({
    user: me,
    'replies.0': { $exists: true },
  })
    .populate('replies.user', 'name username')
    .populate('venue', 'name category')
    .sort({ updatedAt: -1 })
    .lean();

  const items = comments
    .flatMap((c) => {
      const replies = Array.isArray(c.replies) ? c.replies : [];
      return replies
        .filter((r) => String(r?.user?._id ?? r?.user ?? '') !== String(me))
        .map((r) => {
          const replyBy = r?.user && typeof r.user === 'object' ? r.user : null;
          return {
            type: 'comment_reply',
            commentId: c._id,
            venue: c.venue,
            commentPreview: preview(c.text),
            replyPreview: preview(r?.text, 90),
            replyBy,
            updatedAt: r?.createdAt ?? c.updatedAt,
          };
        });
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 20);

  res.json({
    success: true,
    data: { count: items.length, items },
  });
});

export const listFriendRequestNotifications = asyncHandler(async (req, res) => {
  const me = req.user._id;

  const requests = await FriendRequest.find({
    to: me,
    status: 'pending',
  })
    .populate('from', 'name username')
    .sort({ createdAt: -1 })
    .lean();

  const items = requests.map((r) => ({
    type: 'friend_request',
    requestId: r._id,
    from: r.from,
    createdAt: r.createdAt,
  }));

  res.json({
    success: true,
    data: { count: items.length, items },
  });
});

export const listVenueAnnouncementNotifications = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const favorites = await Favorite.find({ user: me }).select('venue').lean();
  const favoriteVenueIds = favorites
    .map((row) => row?.venue)
    .filter(Boolean);

  if (favoriteVenueIds.length === 0) {
    return res.json({
      success: true,
      data: { count: 0, items: [] },
    });
  }

  const itemsRaw = await Venue.find({
    _id: { $in: favoriteVenueIds },
    $or: [
      { announcement: { $exists: true, $ne: '' } },
      { 'announcements.0': { $exists: true } },
    ],
  })
    .select('name category announcement announcements updatedAt')
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  const items = itemsRaw
    .flatMap((v) => {
      const venueInfo = {
        _id: v._id,
        name: v.name,
        category: v.category,
      };
      const list = Array.isArray(v.announcements) ? v.announcements : [];
      if (list.length > 0) {
        return list.map((a) => ({
          type: 'venue_announcement',
          venueId: v._id,
          venue: venueInfo,
          announcement: String(a?.text ?? '').trim(),
          updatedAt: a?.createdAt ?? v.updatedAt,
        }));
      }
      const legacy = String(v.announcement ?? '').trim();
      if (!legacy) return [];
      return [
        {
          type: 'venue_announcement',
          venueId: v._id,
          venue: venueInfo,
          announcement: legacy,
          updatedAt: v.updatedAt,
        },
      ];
    })
    .filter((item) => item.announcement)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 20);

  res.json({
    success: true,
    data: { count: items.length, items },
  });
});
