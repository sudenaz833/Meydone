import { Venue } from '../models/Venue.js';
import { venueMenuForClientResponse } from '../utils/venueMenu.js';
import { VenueRating } from '../models/VenueRating.js';
import { Comment } from '../models/Comment.js';
import { Favorite } from '../models/Favorite.js';
import { AppError } from '../utils/AppError.js';
import { haversineKm } from '../utils/haversineKm.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.create(req.body);
  res.status(201).json({ success: true, data: { venue } });
});

export const listVenues = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Venue.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Venue.countDocuments(),
  ]);

  res.json({
    success: true,
    data: { items, page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const searchVenuesByName = asyncHandler(async (req, res) => {
  const name = String(req.query.name ?? '').trim();
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {
    name: { $regex: name, $options: 'i' },
  };

  const [items, total] = await Promise.all([
    Venue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Venue.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items, page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const filterVenuesByCategory = asyncHandler(async (req, res) => {
  const category = String(req.query.category ?? '').trim();
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {
    category: new RegExp(`^${escapeRegex(category)}$`, 'i'),
  };

  const [items, total] = await Promise.all([
    Venue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Venue.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items, page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const listNearbyVenues = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Math.min(500, Math.max(0.1, Number(req.query.radius) || 10));
  const maxResults = Math.min(100, Math.max(1, Number(req.query.limit) || 25));

  const venues = await Venue.find().lean();

  const withDistance = venues
    .map((v) => {
      const vLat = v.location?.lat;
      const vLng = v.location?.lng;
      if (typeof vLat !== 'number' || typeof vLng !== 'number') {
        return null;
      }
      const distanceKm = haversineKm(lat, lng, vLat, vLng);
      const venue = { ...v, menu: venueMenuForClientResponse(v.menu) };
      return { venue, distanceKm };
    })
    .filter((row) => row !== null && row.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, maxResults);

  res.json({
    success: true,
    data: {
      reference: { lat, lng },
      radiusKm,
      count: withDistance.length,
      items: withDistance,
    },
  });
});

export const listVenuesSortedByRating = asyncHandler(async (req, res) => {
  const by = String(req.query.by ?? '').trim().toLowerCase();
  if (by !== 'rating') {
    throw new AppError('Query parameter "by" must be "rating"', 400);
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const [rawItems, total] = await Promise.all([
    Venue.find()
      .sort({ rating: -1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Venue.countDocuments(),
  ]);

  const items = rawItems.map((v) => ({
    ...v,
    menu: venueMenuForClientResponse(v.menu),
  }));

  res.json({
    success: true,
    data: {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const listVenuesForMap = asyncHandler(async (req, res) => {
  const venues = await Venue.find()
    .select('name category location.lat location.lng')
    .sort({ name: 1 })
    .lean();

  const items = venues.map((v) => ({
    id: v._id,
    name: v.name,
    category: v.category,
    lat: v.location.lat,
    lng: v.location.lng,
  }));

  res.json({
    success: true,
    data: { count: items.length, items },
  });
});

export const getVenueById = asyncHandler(async (req, res) => {
  const raw = await Venue.findById(req.params.id).lean();
  if (!raw) {
    throw new AppError('Mekan bulunamadı.', 404);
  }
  const venue = { ...raw, menu: venueMenuForClientResponse(raw.menu) };
  res.json({ success: true, data: { venue } });
});

export const updateVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!venue) {
    throw new AppError('Venue not found', 404);
  }

  res.json({ success: true, data: { venue } });
});

export const deleteVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }
  await VenueRating.deleteMany({ venue: venue._id });
  await Comment.deleteMany({ venue: venue._id });
  await Favorite.deleteMany({ venue: venue._id });
  await Venue.findByIdAndDelete(venue._id);
  res.status(204).send();
});
