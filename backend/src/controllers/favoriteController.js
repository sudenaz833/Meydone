import { Favorite } from '../models/Favorite.js';
import { Venue } from '../models/Venue.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const ensureFavoriteAllowed = (user) => {
  if (String(user?.role ?? '') === 'owner') {
    throw new AppError('Mekan sahibi hesaplarında favori ozelligi kapalidir.', 403);
  }
};

export const listMyFavorites = asyncHandler(async (req, res) => {
  ensureFavoriteAllowed(req.user);
  const favorites = await Favorite.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('venue', 'name category location rating photoUrl')
    .lean();

  const items = favorites.filter((f) => f.venue != null);

  res.json({ success: true, data: { items } });
});

export const addFavorite = asyncHandler(async (req, res) => {
  ensureFavoriteAllowed(req.user);
  const venueId = req.body.venue ?? req.body.venueId;

  const venue = await Venue.findById(venueId);
  if (!venue) {
    throw new AppError('Venue not found', 404);
  }

  try {
    const favorite = await Favorite.create({
      user: req.user._id,
      venue: venueId,
    });

    const populated = await Favorite.findById(favorite._id).populate(
      'venue',
      'name category location rating',
    );

    res.status(201).json({ success: true, data: { favorite: populated } });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Venue is already in your favorites.', 409);
    }
    throw err;
  }
});

export const removeFavorite = asyncHandler(async (req, res) => {
  ensureFavoriteAllowed(req.user);
  const { venueId } = req.params;

  const favorite = await Favorite.findOneAndDelete({
    user: req.user._id,
    venue: venueId,
  });

  if (!favorite) {
    throw new AppError('Venue is not in your favorites.', 404);
  }

  res.status(204).send();
});
