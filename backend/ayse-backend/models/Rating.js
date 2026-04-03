const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

ratingSchema.index({ venue: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
