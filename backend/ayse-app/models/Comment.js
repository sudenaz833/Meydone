const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, trim: true, default: '' },
    photos: [{ type: String, trim: true }],
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    /** Beğenen kullanıcılar; likes ile tutarlı tutulmalı ($addToSet + $size pipeline) */
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
