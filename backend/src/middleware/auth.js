import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { User } from '../models/User.js';
import { asyncHandler } from './asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Not authorized. No token provided.', 401);
  }

  const token = header.slice(7);
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.secret);
  } catch {
    throw new AppError('Not authorized. Invalid token.', 401);
  }

  const user = await User.findById(decoded.sub).select('-password');
  if (!user) {
    throw new AppError('User no longer exists.', 401);
  }

  req.user = user;
  next();
});

export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized.', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};
