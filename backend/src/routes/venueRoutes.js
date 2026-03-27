import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createVenue,
  listVenues,
  searchVenuesByName,
  filterVenuesByCategory,
  listNearbyVenues,
  listVenuesForMap,
  getVenueById,
  updateVenue,
  deleteVenue,
} from '../controllers/venueController.js';
import { listCommentsByVenue } from '../controllers/commentController.js';
import { rateVenue, getAverageRating } from '../controllers/venueRatingController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const idRule = param('id').isMongoId().withMessage('Invalid venue id');
const nameQueryRule = query('name').trim().notEmpty().withMessage('Query parameter "name" is required');
const categoryQueryRule = query('category')
  .trim()
  .notEmpty()
  .withMessage('Query parameter "category" is required');

const nearbyQueryRules = [
  query('lat')
    .notEmpty()
    .withMessage('Query parameter "lat" is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lng')
    .notEmpty()
    .withMessage('Query parameter "lng" is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 500 })
    .withMessage('Radius must be between 0.1 and 500 (km)'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
];

const venueRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('location.lat')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.lng')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('menu')
    .optional()
    .isArray()
    .withMessage('Menu must be an array of strings'),
  body('menu.*')
    .optional()
    .isString()
    .withMessage('Each menu item must be a string'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('hours')
    .optional()
    .custom(
      (value) =>
        value === undefined ||
        (typeof value === 'object' && value !== null && !Array.isArray(value)),
    )
    .withMessage('Hours must be an object'),
];

const rateVenueRules = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
];

const venueUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('menu')
    .optional()
    .isArray()
    .withMessage('Menu must be an array of strings'),
  body('menu.*')
    .optional()
    .isString()
    .withMessage('Each menu item must be a string'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('hours')
    .optional()
    .custom(
      (value) =>
        value === undefined ||
        (typeof value === 'object' && value !== null && !Array.isArray(value)),
    )
    .withMessage('Hours must be an object'),
];

router.post('/', venueRules, validate, createVenue);
router.get('/', listVenues);
router.get('/search', nameQueryRule, validate, searchVenuesByName);
router.get('/filter', categoryQueryRule, validate, filterVenuesByCategory);
router.get('/nearby', nearbyQueryRules, validate, listNearbyVenues);
router.get('/map', listVenuesForMap);
router.post('/:id/rate', idRule, rateVenueRules, validate, protect, rateVenue);
router.get('/:id/average-rating', idRule, validate, getAverageRating);
router.get('/:id/comments', idRule, validate, listCommentsByVenue);
router.get('/:id', idRule, validate, getVenueById);
router.put('/:id', idRule, venueUpdateRules, validate, updateVenue);
router.delete('/:id', idRule, validate, deleteVenue);

export default router;
