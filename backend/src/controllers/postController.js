import { Post } from '../models/Post.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const listMyPosts = asyncHandler(async (req, res) => {
  const items = await Post.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('user', 'name surname username profilePhoto')
    .lean();
  res.json({ success: true, data: { items } });
});

export const createPost = asyncHandler(async (req, res) => {
  const text = String(req.body.text ?? '').trim();
  const photoUrlRaw = String(req.body.photoUrl ?? '').trim();
  const post = await Post.create({
    user: req.user._id,
    text,
    photoUrl: photoUrlRaw || null,
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
