import mongoose from 'mongoose';

const venueRatingSchema = new mongoose.Schema(
  {
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number',
      },
    },
  },
  { timestamps: true },
);

venueRatingSchema.index({ venue: 1, user: 1 }, { unique: true });

export const VenueRating = mongoose.model('VenueRating', venueRatingSchema);
