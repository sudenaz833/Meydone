import { body } from 'express-validator';
import { assertMenuRequestArray } from '../utils/venueMenu.js';

export const adminRegisterRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .matches(/^[A-Za-zÇĞİÖŞÜçğıöşü\s]+$/)
    .withMessage('Name must contain letters only'),
  body('surname')
    .trim()
    .notEmpty()
    .withMessage('Surname is required')
    .matches(/^[A-Za-zÇĞİÖŞÜçğıöşü\s]+$/)
    .withMessage('Surname must contain letters only'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username may only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('birthDate')
    .notEmpty()
    .withMessage('Birth date is required')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Birth date must be a valid ISO 8601 date')
    .custom((value) => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        throw new Error('Birth date is invalid');
      }
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (d > today) {
        throw new Error('Birth date cannot be in the future');
      }
      return true;
    }),
  body('venue.name').trim().notEmpty().withMessage('Venue name is required'),
  body('venue.category').trim().notEmpty().withMessage('Venue category is required'),
  body('venue.location.lat')
    .notEmpty()
    .withMessage('Venue latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('venue.location.lng')
    .notEmpty()
    .withMessage('Venue longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('venue.menu')
    .isArray()
    .withMessage('Venue menu must be an array (can be empty)')
    .custom((menu) => {
      assertMenuRequestArray(menu);
      return true;
    }),
  body('venue.hours')
    .custom(
      (value) =>
        value !== undefined &&
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value),
    )
    .withMessage('Venue hours must be an object (can be empty, e.g. { mon: "9-17" })'),
  body('venue.rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Venue rating must be between 0 and 5'),
];

export const openApiOwnerRegisterRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('name (venue / business) is required'),
  body('address')
    .custom((value) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') return String(value).trim().length > 0;
      return false;
    })
    .withMessage('address must be a non-empty string'),
  body('openTime').trim().notEmpty().withMessage('openTime is required'),
  body('closeTime').trim().notEmpty().withMessage('closeTime is required'),
];
