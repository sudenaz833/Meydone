import { User } from '../models/User.js';
import { Venue } from '../models/Venue.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/token.js';
import { createResetToken, hashResetToken } from '../utils/resetToken.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { normalizeVenueMenu } from '../utils/venueMenu.js';

const RESET_EXPIRES_MS = 60 * 60 * 1000;

const toAuthResponse = (user) => ({
  user: {
    id: user._id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    username: user.username,
    birthDate: user.birthDate,
    profileVisibility: user.profileVisibility ?? 'public',
    role: user.role,
    createdAt: user.createdAt,
  },
  token: signToken(user._id.toString()),
});

export const register = asyncHandler(async (req, res) => {
  const { name, surname, email, username, password, birthDate, accountType, venue: venuePayload } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedUsername = String(username || '').trim().toLowerCase();
  const normalizedAccountType =
    String(accountType || 'user').trim().toLowerCase() === 'owner' ? 'owner' : 'user';

  if (!normalizedEmail.endsWith('@gmail.com')) {
    throw new AppError('Sadece @gmail.com uzantılı e-posta ile kayıt olabilirsiniz.', 400);
  }

  // Hesap oluşturma çakışmasını kullanıcı adına göre yönet.
  const existingUser = await User.findOne({
    username: normalizedUsername,
  }).select('_id email username');

  if (existingUser) {
    throw new AppError('Bu kullanıcı adı zaten alınmış.', 409);
  }

  if (normalizedAccountType === 'owner') {
    let createdUser = null;
    try {
      createdUser = await User.create({
        name,
        surname,
        email: normalizedEmail,
        username: normalizedUsername,
        password,
        birthDate: new Date(birthDate),
        role: 'owner',
      });

      const hours =
        venuePayload?.hours &&
        typeof venuePayload.hours === 'object' &&
        !Array.isArray(venuePayload.hours)
          ? venuePayload.hours
          : {};

      const venue = await Venue.create({
        name: String(venuePayload?.name || '').trim(),
        category: String(venuePayload?.category || '').trim(),
        location: {
          lat: Number.isFinite(Number(venuePayload?.location?.lat))
            ? Number(venuePayload.location.lat)
            : null,
          lng: Number.isFinite(Number(venuePayload?.location?.lng))
            ? Number(venuePayload.location.lng)
            : null,
        },
        address: {
          city: String(venuePayload?.address?.city || '').trim(),
          district: String(venuePayload?.address?.district || '').trim(),
          neighborhood: String(venuePayload?.address?.neighborhood || '').trim(),
          street: String(venuePayload?.address?.street || '').trim(),
          details: String(venuePayload?.address?.details || '').trim(),
        },
        menu: normalizeVenueMenu(Array.isArray(venuePayload?.menu) ? venuePayload.menu : []),
        hours,
        photoUrl:
          typeof venuePayload?.photoUrl === 'string' && venuePayload.photoUrl.trim()
            ? venuePayload.photoUrl.trim()
            : null,
        owner: createdUser._id,
      });

      res.status(201).json({ success: true, data: { ...toAuthResponse(createdUser), venue } });
    } catch (err) {
      if (createdUser?._id) {
        await User.findByIdAndDelete(createdUser._id);
      }
      throw err;
    }
    return;
  }

  const user = await User.create({
    name,
    surname,
    email: normalizedEmail,
    username: normalizedUsername,
    password,
    birthDate: new Date(birthDate),
    role: 'user',
  });
  res.status(201).json({ success: true, data: toAuthResponse(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, username, identifier, password } = req.body;
  const loginValue = String(identifier || email || username || '')
    .trim()
    .toLowerCase();

  const candidate = await User.findOne({
    $or: [{ email: loginValue }, { username: loginValue }],
  }).select('+password');
  if (!candidate || !(await candidate.comparePassword(password))) {
    throw new AppError('E-posta/kullanıcı adı veya şifre hatalı.', 401);
  }

  const user = await User.findById(candidate._id);
  if (!user) {
    throw new AppError('E-posta/kullanıcı adı veya şifre hatalı.', 401);
  }
  res.json({ success: true, data: toAuthResponse(user) });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

const forgotPasswordMessage =
  'If an account exists for this email, password reset instructions have been sent.';

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const rawToken = createResetToken();
    user.passwordResetTokenHash = hashResetToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + RESET_EXPIRES_MS);
    await user.save({ validateModifiedOnly: true });

    const base = `http://localhost:${env.port}`;
    console.log('\n========== SIMULATED EMAIL (password reset) ==========');
    console.log(`To: ${user.email}`);
    console.log('Subject: Reset your password\n');
    console.log('Use the token below to set a new password (valid for 1 hour).\n');
    console.log(`Token:\n${rawToken}\n`);
    console.log(`Example: POST ${base}/auth/reset-password`);
    console.log(`         POST ${base}/api/auth/reset-password`);
    console.log('Body JSON: { "token": "<token>", "password": "<new password>" }');
    console.log('=======================================================\n');
  }

  res.json({ success: true, message: forgotPasswordMessage });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashed = hashResetToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +passwordResetTokenHash');

  if (!user) {
    throw new AppError('Invalid or expired reset token.', 400);
  }

  user.password = password;
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  await user.save();

  res.json({
    success: true,
    message: 'Password has been reset. You can log in with your new password.',
  });
});
