import { Comment } from '../models/Comment.js';
import { Venue } from '../models/Venue.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const ensureCanInteractWithComments = (user) => {
  if (String(user?.role ?? '') === 'owner') {
    throw new AppError('Mekan sahibi hesaplarında yorum etkileşimi kapalıdır.', 403);
  }
};

export const listCommentsByVenue = asyncHandler(async (req, res) => {
  const venueId = req.params.id;
  const venue = await Venue.findById(venueId).select('_id');
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }

  const items = await Comment.find({ venue: venueId })
    .sort({ createdAt: -1 })
    .populate('user', 'name username')
    .populate('replies.user', 'name username profilePhoto')
    .lean();

  res.json({ success: true, data: { items } });
});

export const createComment = asyncHandler(async (req, res) => {
  ensureCanInteractWithComments(req.user);
  const { venue: venueId, text, photoUrl } = req.body;

  const venue = await Venue.findById(venueId);
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }

  const comment = await Comment.create({
    venue: venueId,
    user: req.user._id,
    text: String(text).trim(),
    photoUrl: typeof photoUrl === 'string' && photoUrl.trim() ? photoUrl.trim() : null,
  });

  const populated = await Comment.findById(comment._id)
    .populate('user', 'name username')
    .populate('replies.user', 'name username profilePhoto')
    .populate('venue', 'name category');

  res.status(201).json({ success: true, data: { comment: populated } });
});

export const updateComment = asyncHandler(async (req, res) => {
  ensureCanInteractWithComments(req.user);
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }
  if (!comment.user.equals(req.user._id)) {
    throw new AppError('You can only edit your own comments.', 403);
  }

  const { rating, text, photoUrl } = req.body;
  if (rating !== undefined) comment.rating = Number(rating);
  if (text !== undefined) comment.text = String(text).trim();
  if (photoUrl !== undefined) {
    comment.photoUrl = typeof photoUrl === 'string' && photoUrl.trim() ? photoUrl.trim() : null;
  }

  await comment.save();

  const populated = await Comment.findById(comment._id)
    .populate('user', 'name username')
    .populate('replies.user', 'name username profilePhoto')
    .populate('venue', 'name category');

  res.json({ success: true, data: { comment: populated } });
});

export const deleteComment = asyncHandler(async (req, res) => {
  ensureCanInteractWithComments(req.user);
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }
  if (!comment.user.equals(req.user._id)) {
    throw new AppError('You can only delete your own comments.', 403);
  }

  await Comment.findByIdAndDelete(comment._id);
  res.status(204).send();
});

export const likeComment = asyncHandler(async (req, res) => {
  ensureCanInteractWithComments(req.user);
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  const alreadyLiked = (comment.likedBy ?? []).some((id) => id.equals(req.user._id));

  if (alreadyLiked) {
    comment.likedBy = (comment.likedBy ?? []).filter((id) => !id.equals(req.user._id));
  } else {
    comment.likedBy = [...(comment.likedBy ?? []), req.user._id];
  }

  await comment.save();

  const populated = await Comment.findById(comment._id)
    .populate('user', 'name username')
    .populate('replies.user', 'name username profilePhoto')
    .populate('venue', 'name category');

  const likeCount = (populated?.likedBy ?? []).length;

  res.json({
    success: true,
    data: {
      comment: populated,
      likeCount,
      liked: !alreadyLiked,
    },
  });
});

export const addCommentPhoto = asyncHandler(async (req, res) => {
  ensureCanInteractWithComments(req.user);
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }
  if (!comment.user.equals(req.user._id)) {
    throw new AppError('You can only add a photo to your own comments.', 403);
  }

  const url = String(req.body.url).trim();
  comment.photoUrl = url;
  await comment.save();

  console.log('[SIMULATED PHOTO UPLOAD] Comment photo URL stored (no binary upload)', {
    commentId: String(comment._id),
    url,
  });

  const populated = await Comment.findById(comment._id)
    .populate('user', 'name username')
    .populate('replies.user', 'name username profilePhoto')
    .populate('venue', 'name category');

  res.json({
    success: true,
    data: { comment: populated, photoUrl: url },
  });
});

export const addReplyToComment = asyncHandler(async (req, res) => {
  ensureCanInteractWithComments(req.user);
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  const text = String(req.body.text ?? '').trim();
  if (!text) {
    throw new AppError('Reply text is required', 400);
  }

  comment.replies = Array.isArray(comment.replies) ? comment.replies : [];
  comment.replies.push({
    user: req.user._id,
    text,
    createdAt: new Date(),
  });
  await comment.save();

  const populated = await Comment.findById(comment._id)
    .populate('user', 'name username')
    .populate('replies.user', 'name username profilePhoto')
    .populate('venue', 'name category');

  res.status(201).json({ success: true, data: { comment: populated } });
});
