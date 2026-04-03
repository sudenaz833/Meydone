import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listMyFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/favoriteController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

const normalizeFavoriteVenue = (req, res, next) => {
  if (req.body.venueId && !req.body.venue) {
    req.body.venue = req.body.venueId;
  }
  next();
};

const addFavoriteRules = [
  body('venue').isMongoId().withMessage('Valid venue id is required'),
];

const venueIdParamRule = param('venueId').isMongoId().withMessage('Valid venue id is required');

router.get('/', listMyFavorites);
router.post('/', normalizeFavoriteVenue, addFavoriteRules, validate, addFavorite);
router.delete('/:venueId', venueIdParamRule, validate, removeFavorite);

export default router;
