import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  addCommentPhoto,
  addReplyToComment,
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

const commentIdRule = param('id').isMongoId().withMessage('Invalid comment id');

const updateCommentRules = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('text')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Comment text cannot be empty')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot exceed 2000 characters'),
  body('photoUrl')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (typeof value !== 'string') throw new Error('Fotoğraf alanı metin olmalıdır');
      const trimmed = value.trim();
      const isHttp = /^https?:\/\//i.test(trimmed);
      const isDataImage = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(trimmed);
      if (!isHttp && !isDataImage) {
        throw new Error('Fotoğraf geçerli bir URL veya görsel verisi olmalıdır');
      }
      if (isDataImage) {
        const commaIndex = trimmed.indexOf(',');
        const base64 = commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : '';
        const approxBytes = Math.floor((base64.length * 3) / 4);
        const maxBytes = 5 * 1024 * 1024;
        if (approxBytes > maxBytes) {
          throw new Error('Fotoğraf en fazla 5 MB olabilir');
        }
      }
      return true;
    }),
  body().custom((_, { req }) => {
    if (
      req.body.rating === undefined &&
      req.body.text === undefined &&
      req.body.photoUrl === undefined
    ) {
      throw new Error('En az bir alan gönderin: puan, yorum veya fotoğraf');
    }
    return true;
  }),
];

const commentPhotoRules = [
  body('url')
    .trim()
    .notEmpty()
    .withMessage('URL is required')
    .isURL()
    .withMessage('Must be a valid URL'),
];

const createCommentRules = [
  body('venue').isMongoId().withMessage('Valid venue id is required'),
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot exceed 2000 characters'),
  body('photoUrl')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (typeof value !== 'string') throw new Error('Fotoğraf alanı metin olmalıdır');
      const trimmed = value.trim();
      const isHttp = /^https?:\/\//i.test(trimmed);
      const isDataImage = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(trimmed);
      if (!isHttp && !isDataImage) {
        throw new Error('Fotoğraf geçerli bir URL veya görsel verisi olmalıdır');
      }
      if (isDataImage) {
        const commaIndex = trimmed.indexOf(',');
        const base64 = commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : '';
        const approxBytes = Math.floor((base64.length * 3) / 4);
        const maxBytes = 5 * 1024 * 1024;
        if (approxBytes > maxBytes) {
          throw new Error('Fotoğraf en fazla 5 MB olabilir');
        }
      }
      return true;
    }),
];

router.post('/', createCommentRules, validate, createComment);
router.post('/:id/like', commentIdRule, validate, likeComment);
router.post(
  '/:id/replies',
  commentIdRule,
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Reply text is required')
    .isLength({ max: 1000 })
    .withMessage('Reply cannot exceed 1000 characters'),
  validate,
  addReplyToComment,
);
router.post('/:id/photo', commentIdRule, commentPhotoRules, validate, addCommentPhoto);
router.put('/:id', commentIdRule, updateCommentRules, validate, updateComment);
router.delete('/:id', commentIdRule, validate, deleteComment);

export default router;
