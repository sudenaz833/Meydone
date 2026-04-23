import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Venue } from '../models/Venue.js';
import { VenueRating } from '../models/VenueRating.js';
import { Comment } from '../models/Comment.js';
import { Favorite } from '../models/Favorite.js';
import { Post } from '../models/Post.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/token.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { runValidators } from '../middleware/validate.js';
import { adminRegisterRules, openApiOwnerRegisterRules } from '../validation/adminValidators.js';
import { normalizeVenueMenu } from '../utils/venueMenu.js';

const toAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  surname: user.surname,
  email: user.email,
  username: user.username,
  birthDate: user.birthDate,
  role: user.role,
  createdAt: user.createdAt,
});

export const createOwnedVenue = asyncHandler(async (req, res) => {
  const { name, category, address, location, menu, hours, photoUrl } = req.body;
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
  const venue = await Venue.create({
    name: String(name).trim(),
    category: String(category).trim(),
    location: {
      lat: hasLocation ? lat : null,
      lng: hasLocation ? lng : null,
    },
    address: {
      city: String(address?.city ?? '').trim(),
      district: String(address?.district ?? '').trim(),
      neighborhood: String(address?.neighborhood ?? '').trim(),
      street: String(address?.street ?? '').trim(),
      details: String(address?.details ?? '').trim(),
    },
    menu: normalizeVenueMenu(Array.isArray(menu) ? menu : []),
    hours:
      hours && typeof hours === 'object' && !Array.isArray(hours)
        ? hours
        : {},
    photoUrl:
      typeof photoUrl === 'string' && photoUrl.trim() ? photoUrl.trim() : null,
    owner: req.user._id,
  });
  res.status(201).json({ success: true, data: { venue } });
});

export const registerAdminWithVenue = asyncHandler(async (req, res) => {
  const { name, surname, email, username, password, birthDate, venue: venuePayload } = req.body;

  const session = await mongoose.startSession();
  let user;
  let venue;

  try {
    session.startTransaction();
    [user] = await User.create(
      [
        {
          name,
          surname,
          email,
          username,
          password,
          birthDate: new Date(birthDate),
          role: 'admin',
        },
      ],
      { session },
    );

    const hours =
      venuePayload.hours &&
      typeof venuePayload.hours === 'object' &&
      !Array.isArray(venuePayload.hours)
        ? venuePayload.hours
        : {};

    [venue] = await Venue.create(
      [
        {
          name: venuePayload.name,
          category: venuePayload.category,
          location: {
            lat: Number(venuePayload.location.lat),
            lng: Number(venuePayload.location.lng),
          },
          menu: normalizeVenueMenu(Array.isArray(venuePayload.menu) ? venuePayload.menu : []),
          hours,
          rating:
            venuePayload.rating !== undefined && venuePayload.rating !== null
              ? Number(venuePayload.rating)
              : 0,
          owner: user._id,
        },
      ],
      { session },
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  res.status(201).json({
    success: true,
    data: {
      user: toAuthUser(user),
      venue,
      token: signToken(user._id.toString()),
    },
  });
});

const isOpenApiOwnerRegisterBody = (b) =>
  b &&
  typeof b === 'object' &&
  b.venue === undefined &&
  b.username === undefined &&
  b.birthDate === undefined &&
  typeof b.email === 'string' &&
  typeof b.password === 'string' &&
  typeof b.name === 'string' &&
  typeof b.address === 'string' &&
  typeof b.openTime === 'string' &&
  typeof b.closeTime === 'string';

export const registerOwnerOpenApi = asyncHandler(async (req, res) => {
  const { email, password, name, address, openTime, closeTime } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const addressStr = String(address).trim();
  const venueName = String(name).trim();

  const dup = await User.findOne({ email: normalizedEmail }).select('_id');
  if (dup) {
    throw new AppError('Bu e-posta adresi zaten kayıtlı.', 409);
  }

  const nameParts = venueName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'İşletme';
  const lastName = nameParts.slice(1).join(' ') || 'Sahibi';

  const local = normalizedEmail.split('@')[0] || 'owner';
  let base = local.replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'owner';
  let username = base;
  let n = 0;
  while (await User.findOne({ username })) {
    n += 1;
    username = `${base}${n}`.slice(0, 30);
  }

  const session = await mongoose.startSession();
  let user;
  let venue;

  try {
    session.startTransaction();
    [user] = await User.create(
      [
        {
          name: firstName,
          surname: lastName,
          email: normalizedEmail,
          username,
          password,
          birthDate: new Date('1990-01-01'),
          role: 'owner',
        },
      ],
      { session },
    );

    [venue] = await Venue.create(
      [
        {
          name: venueName,
          category: 'Genel',
          location: { lat: null, lng: null },
          address: {
            city: '',
            district: '',
            neighborhood: '',
            street: addressStr,
            details: '',
          },
          menu: [],
          hours: {
            openTime: String(openTime).trim(),
            closeTime: String(closeTime).trim(),
          },
          rating: 0,
          owner: user._id,
        },
      ],
      { session },
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  res.status(201).json({
    success: true,
    data: {
      user: toAuthUser(user),
      venue,
      token: signToken(user._id.toString()),
    },
  });
});

export const registerAdminEntry = asyncHandler(async (req, res, next) => {
  if (isOpenApiOwnerRegisterBody(req.body)) {
    await runValidators(req, openApiOwnerRegisterRules);
    return registerOwnerOpenApi(req, res, next);
  }
  await runValidators(req, adminRegisterRules);
  return registerAdminWithVenue(req, res, next);
});

export const deleteOwnedVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }
  if (!venue.owner) {
    throw new AppError(
      'This venue has no owner record. It cannot be deleted with this endpoint.',
      403,
    );
  }
  if (!venue.owner.equals(req.user._id)) {
    throw new AppError('You can only delete venues you own.', 403);
  }

  await VenueRating.deleteMany({ venue: venue._id });
  await Comment.deleteMany({ venue: venue._id });
  await Favorite.deleteMany({ venue: venue._id });
  await Venue.findByIdAndDelete(venue._id);

  res.status(204).send();
});

export const updateVenueHours = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }
  if (!venue.owner) {
    throw new AppError(
      'This venue has no owner record. Hours cannot be updated with this endpoint.',
      403,
    );
  }
  if (!venue.owner.equals(req.user._id)) {
    throw new AppError('You can only update hours for venues you own.', 403);
  }

  const { hours, openTime, closeTime } = req.body;
  if (hours !== undefined && hours !== null) {
    venue.hours =
      typeof hours === 'object' && !Array.isArray(hours) ? { ...hours } : venue.hours;
  }
  if (openTime !== undefined || closeTime !== undefined) {
    const h = { ...(venue.hours && typeof venue.hours === 'object' ? venue.hours : {}) };
    if (openTime !== undefined) h.openTime = String(openTime).trim();
    if (closeTime !== undefined) h.closeTime = String(closeTime).trim();
    venue.hours = h;
  }
  await venue.save();

  res.json({ success: true, data: { venue } });
});

export const updateVenueLocation = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }
  if (!venue.owner) {
    throw new AppError(
      'This venue has no owner record. Location cannot be updated with this endpoint.',
      403,
    );
  }
  if (!venue.owner.equals(req.user._id)) {
    throw new AppError('You can only update location for venues you own.', 403);
  }

  const latRaw = req.body.location?.lat ?? req.body.lat;
  const lngRaw = req.body.location?.lng ?? req.body.lng;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new AppError('lat and lng must be valid numbers', 400);
  }
  venue.location.lat = lat;
  venue.location.lng = lng;
  await venue.save();

  res.json({ success: true, data: { venue } });
});

export const updateVenueAddress = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }
  if (!venue.owner) {
    throw new AppError(
      'This venue has no owner record. Address cannot be updated with this endpoint.',
      403,
    );
  }
  if (!venue.owner.equals(req.user._id)) {
    throw new AppError('You can only update address for venues you own.', 403);
  }

  const { address } = req.body;
  venue.address = {
    city: String(address?.city ?? '').trim(),
    district: String(address?.district ?? '').trim(),
    neighborhood: String(address?.neighborhood ?? '').trim(),
    street: String(address?.street ?? '').trim(),
    details: String(address?.details ?? '').trim(),
  };
  await venue.save();

  res.json({ success: true, data: { venue } });
});

export const updateVenueMenu = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }
  if (!venue.owner) {
    throw new AppError(
      'This venue has no owner record. Menu cannot be updated with this endpoint.',
      403,
    );
  }
  if (!venue.owner.equals(req.user._id)) {
    throw new AppError('You can only update the menu for venues you own.', 403);
  }

  let rawMenu = req.body.menu;
  if (Array.isArray(req.body.items)) {
    rawMenu = req.body.items;
  }
  if (!Array.isArray(rawMenu)) {
    throw new AppError('menu or items must be an array', 400);
  }
  venue.menu = normalizeVenueMenu(rawMenu);
  await venue.save();

  res.json({ success: true, data: { venue } });
});

export const updateVenueAnnouncement = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }
  if (!venue.owner) {
    throw new AppError(
      'This venue has no owner record. Announcement cannot be updated with this endpoint.',
      403,
    );
  }
  if (!venue.owner.equals(req.user._id)) {
    throw new AppError('You can only update announcement for venues you own.', 403);
  }

  const text = String(req.body.announcement ?? '').trim();
  const shareAsPost = Boolean(req.body.shareAsPost);
  if (text) {
    venue.announcements = Array.isArray(venue.announcements)
      ? venue.announcements
      : [];
    venue.announcements.unshift({ text, createdAt: new Date() });
    if (venue.announcements.length > 30) {
      venue.announcements = venue.announcements.slice(0, 30);
    }
  }
  // Backward-compatible latest announcement field.
  venue.announcement = text;
  await venue.save();

  let post = null;
  if (text && shareAsPost) {
    const postText = `${venue.name}: ${text}`;
    const postPhotoUrl = String(req.body.postPhotoUrl ?? '').trim();
    post = await Post.create({
      user: req.user._id,
      text: postText.slice(0, 1000),
      photoUrl:
        postPhotoUrl ||
        (typeof venue.photoUrl === 'string' && venue.photoUrl.trim() ? venue.photoUrl.trim() : null),
    });
  }

  res.json({ success: true, data: { venue, post } });
});

export const addVenuePhoto = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }
  if (!venue.owner) {
    throw new AppError(
      'This venue has no owner record. Photo cannot be set with this endpoint.',
      403,
    );
  }
  if (!venue.owner.equals(req.user._id)) {
    throw new AppError('You can only add a photo to venues you own.', 403);
  }

  let photoUrl = '';
  if (req.file?.buffer) {
    const mime = req.file.mimetype || 'image/jpeg';
    photoUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
  } else {
    photoUrl = String(req.body.photoUrl || '').trim();
  }
  if (!photoUrl) {
    throw new AppError('file (multipart) or photoUrl is required', 400);
  }
  if (!photoUrl.startsWith('data:image/')) {
    throw new AppError('photoUrl must be an image data URL', 400);
  }
  venue.photoUrl = photoUrl;
  await venue.save();

  console.log('[PHOTO UPLOAD] Venue photo data saved', {
    venueId: String(venue._id),
    photoSize: photoUrl.length,
  });

  res.status(201).json({
    success: true,
    data: { venue, photoUrl },
  });
});
