import crypto from 'crypto';

export const createResetToken = () => crypto.randomBytes(32).toString('hex');

export const hashResetToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');
