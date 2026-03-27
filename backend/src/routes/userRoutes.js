import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  updateMyProfile,
  updateProfilePrivacy,
  deleteMyAccount,
} from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

const profileRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('surname')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Surname cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Surname cannot exceed 100 characters'),
  body('phone')
    .optional({ nullable: true })
    .trim()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('Phone must contain 7-15 digits and optional + prefix'),
  body('profilePhoto')
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
    .withMessage('Profile photo must be an image data URL up to 5 MB'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('profileVisibility')
    .optional()
    .isIn(['public', 'private', 'friends_only'])
    .withMessage('profileVisibility must be public, private, or friends_only'),
  body('commentVisibility')
    .optional()
    .isIn(['public', 'private', 'friends_only'])
    .withMessage('commentVisibility must be public, private, or friends_only'),
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password cannot be empty'),
];

const idRule = param('id').isMongoId().withMessage('Invalid user id');

const privacyRules = [
  body('profileVisibility')
    .notEmpty()
    .withMessage('profileVisibility is required')
    .isIn(['public', 'private', 'friends_only'])
    .withMessage('profileVisibility must be public, private, or friends_only'),
  body('commentVisibility')
    .optional()
    .isIn(['public', 'private', 'friends_only'])
    .withMessage('commentVisibility must be public, private, or friends_only'),
  body('postsVisibility')
    .optional()
    .isIn(['public', 'private', 'friends_only'])
    .withMessage('postsVisibility must be public, private, or friends_only'),
  body('locationVisibility')
    .optional()
    .isIn(['public', 'private', 'friends_only'])
    .withMessage('locationVisibility must be public, private, or friends_only'),
];

const deleteAccountRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
];

router.put('/profile', profileRules, validate, updateMyProfile);
router.post('/privacy', privacyRules, validate, updateProfilePrivacy);
router.delete('/account', deleteAccountRules, validate, deleteMyAccount);

router.use(restrictTo('admin'));

router.get('/', listUsers);
router.get('/:id', idRule, validate, getUserById);
router.patch(
  '/:id/role',
  idRule,
  body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  validate,
  updateUserRole,
);
router.delete('/:id', idRule, validate, deleteUser);

export default router;
