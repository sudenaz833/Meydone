import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

favoriteSchema.index({ user: 1, venue: 1 }, { unique: true });

export const Favorite = mongoose.model('Favorite', favoriteSchema);
