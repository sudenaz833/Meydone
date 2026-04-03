import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join('. ');
    return next(new AppError(message, 400));
  }
  next();
};

export async function runValidators(req, rules) {
  await Promise.all(rules.map((rule) => rule.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map((e) => e.msg).join('. ');
    throw new AppError(message, 400);
  }
}
