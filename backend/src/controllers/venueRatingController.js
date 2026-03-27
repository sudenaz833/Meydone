import mongoose from 'mongoose';
import { Venue } from '../models/Venue.js';
import { VenueRating } from '../models/VenueRating.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const computeVenueRatingStats = async (venueId) => {
  const id = new mongoose.Types.ObjectId(venueId);
  const [agg] = await VenueRating.aggregate([
    { $match: { venue: id } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const count = agg?.count ?? 0;
  const raw = agg?.avgRating;
  const averageRating =
    count === 0 || raw == null ? null : Math.round(raw * 100) / 100;
  return { count, averageRating };
};

const syncVenueAverageRating = async (venueId) => {
  const { averageRating } = await computeVenueRatingStats(venueId);
  await Venue.findByIdAndUpdate(venueId, { rating: averageRating ?? 0 });
};

export const rateVenue = asyncHandler(async (req, res) => {
  if (String(req.user?.role ?? '') === 'owner') {
    throw new AppError('Mekan sahibi hesapları puan veremez.', 403);
  }
  const { id: venueId } = req.params;
  const rating = Number(req.body.rating);

  const venue = await Venue.findById(venueId);
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }

  const existing = await VenueRating.findOne({ venue: venueId, user: req.user._id }).select('_id');
  const updatedRating = await VenueRating.findOneAndUpdate(
    { venue: venueId, user: req.user._id },
    { rating },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await syncVenueAverageRating(venueId);
  const updated = await Venue.findById(venueId);

  res.status(existing ? 200 : 201).json({
    success: true,
    data: {
      venue: updated,
      yourRating: updatedRating.rating,
      updated: Boolean(existing),
    },
  });
});

export const getAverageRating = asyncHandler(async (req, res) => {
  const { id: venueId } = req.params;
  const venue = await Venue.findById(venueId).select('_id');
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }

  const { count, averageRating } = await computeVenueRatingStats(venueId);

  res.json({
    success: true,
    data: {
      venueId: venue._id,
      ratingCount: count,
      averageRating,
    },
  });
});
