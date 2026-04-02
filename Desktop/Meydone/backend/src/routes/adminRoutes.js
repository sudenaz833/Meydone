import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  registerAdminEntry,
  createOwnedVenue,
  deleteOwnedVenue,
  updateVenueHours,
  updateVenueLocation,
  updateVenueAddress,
  updateVenueMenu,
  updateVenueAnnouncement,
  addVenuePhoto,
} from '../controllers/adminController.js';
import { requireAdminRegisterSecret } from '../middleware/requireAdminRegisterSecret.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadSingleImage } from '../middleware/memoryUpload.js';
import { assertMenuRequestArray } from '../utils/venueMenu.js';

const router = Router();

const adminVenueIdRule = param('id').isMongoId().withMessage('Invalid venue id');

const updateVenueHoursRules = [
  body().custom((_, { req }) => {
    const hasHours =
      req.body.hours !== undefined &&
      req.body.hours !== null &&
      typeof req.body.hours === 'object' &&
      !Array.isArray(req.body.hours);
    const ot = String(req.body.openTime ?? '').trim();
    const ct = String(req.body.closeTime ?? '').trim();
    const hasTimes = ot.length > 0 && ct.length > 0;
    if (!hasHours && !hasTimes) {
      throw new Error('Send hours object and/or both openTime and closeTime');
    }
    return true;
  }),
  body('hours')
    .optional()
    .custom(
      (value) =>
        value === undefined ||
        value === null ||
        (typeof value === 'object' && !Array.isArray(value)),
    )
    .withMessage('hours must be a plain object'),
  body('openTime').optional().isString(),
  body('closeTime').optional().isString(),
];

const createOwnedVenueRules = [
  body('name').trim().notEmpty().withMessage('Venue name is required'),
  body('category').trim().notEmpty().withMessage('Venue category is required'),
  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('location.lat must be between -90 and 90'),
  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('location.lng must be between -180 and 180'),
  body('address.city')
    .notEmpty()
    .withMessage('address.city is required'),
  body('address.district')
    .notEmpty()
    .withMessage('address.district is required'),
  body('address.neighborhood')
    .notEmpty()
    .withMessage('address.neighborhood is required'),
  body('address.street')
    .notEmpty()
    .withMessage('address.street is required'),
  body('address.details').optional().isString().withMessage('address.details must be a string'),
  body('menu')
    .optional()
    .isArray()
    .withMessage('menu must be an array')
    .custom((menu) => {
      if (menu === undefined) return true;
      assertMenuRequestArray(menu);
      return true;
    }),
  body('hours')
    .optional()
    .custom(
      (value) =>
        value === undefined ||
        (value !== null && typeof value === 'object' && !Array.isArray(value)),
    )
    .withMessage('hours must be an object'),
  body('photoUrl')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (typeof value !== 'string') return false;
      const trimmed = value.trim();
      if (!trimmed) return true;
      if (!trimmed.startsWith('data:image/')) return false;
      const comma = trimmed.indexOf(',');
      if (comma < 0) return false;
      const b64 = trimmed.slice(comma + 1);
      const bytes = Math.floor((b64.length * 3) / 4);
      return bytes <= 5 * 1024 * 1024;
    })
    .withMessage('photoUrl must be an image data URL up to 5 MB'),
];

const updateVenueLocationRules = [
  body().custom((_, { req }) => {
    const lat = req.body.location?.lat ?? req.body.lat;
    const lng = req.body.location?.lng ?? req.body.lng;
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      throw new Error('lat and lng required (top-level or under location)');
    }
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(la) || la < -90 || la > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    if (!Number.isFinite(ln) || ln < -180 || ln > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
    return true;
  }),
  body('lat').optional().isFloat({ min: -90, max: 90 }),
  body('lng').optional().isFloat({ min: -180, max: 180 }),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }),
];

const updateVenueAddressRules = [
  body('address.city').notEmpty().withMessage('address.city is required'),
  body('address.district').notEmpty().withMessage('address.district is required'),
  body('address.neighborhood').notEmpty().withMessage('address.neighborhood is required'),
  body('address.street').notEmpty().withMessage('address.street is required'),
  body('address.details').optional().isString().withMessage('address.details must be a string'),
];

const updateVenueMenuRules = [
  body().custom((_, { req }) => {
    if (!Array.isArray(req.body.menu) && !Array.isArray(req.body.items)) {
      throw new Error('menu or items must be an array');
    }
    if (Array.isArray(req.body.menu)) {
      assertMenuRequestArray(req.body.menu);
    }
    if (Array.isArray(req.body.items)) {
      assertMenuRequestArray(req.body.items);
    }
    return true;
  }),
  body('menu').optional().isArray().withMessage('menu must be an array (can be empty)'),
  body('items').optional().isArray().withMessage('items must be an array'),
];

const updateVenueAnnouncementRules = [
  body('announcement')
    .optional({ nullable: true })
    .isString()
    .withMessage('announcement must be a string')
    .isLength({ max: 500 })
    .withMessage('announcement must be at most 500 chars'),
  body('shareAsPost')
    .optional()
    .isBoolean()
    .withMessage('shareAsPost must be boolean'),
  body('postPhotoUrl')
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
    .withMessage('postPhotoUrl must be an image data URL up to 5 MB'),
];

const venuePhotoRules = [
  body('photoUrl')
    .custom((value, { req }) => {
      if (req.file) return true;
      if (typeof value !== 'string') return false;
      const trimmed = value.trim();
      if (!trimmed.startsWith('data:image/')) return false;
      const comma = trimmed.indexOf(',');
      if (comma < 0) return false;
      const b64 = trimmed.slice(comma + 1);
      const bytes = Math.floor((b64.length * 3) / 4);
      return bytes <= 5 * 1024 * 1024;
    })
    .withMessage('Multipart file or photoUrl (image data URL up to 5 MB) is required'),
];

router.post('/register', requireAdminRegisterSecret, registerAdminEntry);
router.post(
  '/venues',
  protect,
  restrictTo('admin', 'owner'),
  createOwnedVenueRules,
  validate,
  createOwnedVenue,
);
router.put(
  '/venues/:id/hours',
  protect,
  restrictTo('admin', 'owner'),
  adminVenueIdRule,
  updateVenueHoursRules,
  validate,
  updateVenueHours,
);
router.put(
  '/venues/:id/location',
  protect,
  restrictTo('admin', 'owner'),
  adminVenueIdRule,
  updateVenueLocationRules,
  validate,
  updateVenueLocation,
);
router.put(
  '/venues/:id/address',
  protect,
  restrictTo('admin', 'owner'),
  adminVenueIdRule,
  updateVenueAddressRules,
  validate,
  updateVenueAddress,
);
router.put(
  '/venues/:id/menu',
  protect,
  restrictTo('admin', 'owner'),
  adminVenueIdRule,
  updateVenueMenuRules,
  validate,
  updateVenueMenu,
);
router.put(
  '/venues/:id/announcement',
  protect,
  restrictTo('admin', 'owner'),
  adminVenueIdRule,
  updateVenueAnnouncementRules,
  validate,
  updateVenueAnnouncement,
);
router.post(
  '/venues/:id/photo',
  protect,
  restrictTo('admin', 'owner'),
  adminVenueIdRule,
  validate,
  uploadSingleImage.single('file'),
  ...venuePhotoRules,
  validate,
  addVenuePhoto,
);
router.delete(
  '/venues/:id',
  protect,
  restrictTo('admin', 'owner'),
  adminVenueIdRule,
  validate,
  deleteOwnedVenue,
);

export default router;
