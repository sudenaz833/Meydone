import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const requireAdminRegisterSecret = (req, res, next) => {
  const secret = env.adminRegisterSecret;

  if (!secret) {
    if (env.nodeEnv === 'production') {
      return next(
        new AppError(
          'Admin registration is disabled in production without ADMIN_REGISTER_SECRET.',
          503,
        ),
      );
    }
    return next();
  }

  if (req.get('x-admin-register-secret') !== secret) {
    return next(new AppError('Invalid or missing X-Admin-Register-Secret header.', 403));
  }

  next();
};
