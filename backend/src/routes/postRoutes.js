import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createPost,
  deleteMyPost,
  listFriendsFeedPosts,
  listMyPosts,
} from '../controllers/postController.js';

const router = Router();
router.use(protect);

const postPhotoRule = body('photoUrl')
  .optional({ nullable: true })
  .custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed.startsWith('data:image/')) return false;
    const comma = trimmed.indexOf(',');
    if (comma < 0) return false;
    const b64 = trimmed.slice(comma + 1);
    const bytes = Math.floor((b64.length * 3) / 4);
    return bytes <= 5 * 1024 * 1024;
  })
  .withMessage('photoUrl en fazla 5 MB görsel veri olmalı');

router.get('/me', listMyPosts);
router.get('/feed', listFriendsFeedPosts);
router.post(
  '/',
  body('text').trim().notEmpty().withMessage('Paylaşım metni zorunludur').isLength({ max: 1000 }).withMessage('Paylaşım metni en fazla 1000 karakter olabilir'),
  postPhotoRule,
  body('lat')
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage('lat -90 ile 90 arasında olmalıdır'),
  body('lng')
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage('lng -180 ile 180 arasında olmalıdır'),
  validate,
  createPost,
);
router.delete('/:id', param('id').isMongoId().withMessage('Geçersiz paylaşım id'), validate, deleteMyPost);

export default router;
