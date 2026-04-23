import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listUsers,
  getUserById,
  updateUserRole,
  deleteUserByIdOrSelf,
  updateMyProfile,
  updateProfilePrivacy,
  updateMyLocation,
  deleteMyAccount,
} from '../controllers/userController.js';
import { createPost } from '../controllers/postController.js';
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
    .matches(/^[A-Za-zÇĞİÖŞÜçğıöşü\s]+$/)
    .withMessage('Name must contain letters only')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('surname')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Surname cannot be empty')
    .matches(/^[A-Za-zÇĞİÖŞÜçğıöşü\s]+$/)
    .withMessage('Surname must contain letters only')
    .isLength({ max: 100 })
    .withMessage('Surname cannot exceed 100 characters'),
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('firstName cannot be empty')
    .matches(/^[A-Za-zÇĞİÖŞÜçğıöşü\s]+$/)
    .withMessage('firstName must contain letters only')
    .isLength({ max: 100 })
    .withMessage('firstName cannot exceed 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('lastName cannot be empty')
    .matches(/^[A-Za-zÇĞİÖŞÜçğıöşü\s]+$/)
    .withMessage('lastName must contain letters only')
    .isLength({ max: 100 })
    .withMessage('lastName cannot exceed 100 characters'),
  body('phone')
    .optional({ nullable: true })
    .trim()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('Phone must contain 7-15 digits and optional + prefix'),
  body('phoneNumber')
    .optional({ nullable: true })
    .trim()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('phoneNumber must contain 7-15 digits and optional + prefix'),
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
  body('locationVisibility')
    .optional()
    .isIn(['public', 'private', 'friends_only'])
    .withMessage('locationVisibility must be public, private, or friends_only'),
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password cannot be empty'),
];

const idRule = param('id').isMongoId().withMessage('Invalid user id');

const privacyRules = [
  body().custom((_, { req }) => {
    const b = req.body || {};
    const has =
      b.profileVisibility != null ||
      b.commentVisibility != null ||
      b.postsVisibility != null ||
      b.postVisibility != null ||
      b.locationVisibility != null;
    if (!has) {
      throw new Error('At least one privacy field is required');
    }
    return true;
  }),
  body('profileVisibility')
    .optional()
    .isIn(['public', 'private', 'friends_only', 'friends'])
    .withMessage('profileVisibility must be public, private, friends, or friends_only'),
  body('commentVisibility')
    .optional()
    .isIn(['public', 'private', 'friends_only', 'friends'])
    .withMessage('commentVisibility must be public, private, friends, or friends_only'),
  body('postsVisibility')
    .optional()
    .isIn(['public', 'private', 'friends_only', 'friends'])
    .withMessage('postsVisibility must be public, private, friends, or friends_only'),
  body('postVisibility')
    .optional()
    .isIn(['public', 'private', 'friends_only', 'friends'])
    .withMessage('postVisibility must be public, private, friends, or friends_only'),
  body('locationVisibility')
    .optional()
    .isIn(['public', 'private', 'friends_only', 'friends'])
    .withMessage('locationVisibility must be public, private, friends, or friends_only'),
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

const locationUpdateRules = [
  body('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('lat must be between -90 and 90'),
  body('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('lng must be between -180 and 180'),
];

router.put('/profile', profileRules, validate, updateMyProfile);
router.put('/location', locationUpdateRules, validate, updateMyLocation);
router.post('/privacy', privacyRules, validate, updateProfilePrivacy);
router.delete('/account', deleteAccountRules, validate, deleteMyAccount);

const openApiPostRules = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('content is required')
    .isLength({ max: 1000 })
    .withMessage('content must be at most 1000 characters'),
  body('imageUrl')
    .optional({ nullable: true })
    .isString()
    .withMessage('imageUrl must be a string'),
  body('lat')
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage('lat must be between -90 and 90'),
  body('lng')
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage('lng must be between -180 and 180'),
];

router.post('/posts', openApiPostRules, validate, (req, res, next) => {
  req.body.text = String(req.body.content ?? '').trim();
  const img = req.body.imageUrl;
  if (img !== undefined && img !== null && String(img).trim() !== '') {
    req.body.photoUrl = String(img).trim();
  }
  next();
}, createPost);

router.delete('/:id', idRule, validate, deleteUserByIdOrSelf);

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
export default router;
