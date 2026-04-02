import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: [true, 'Venue is required'],
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
      default: null,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
      validate: {
        validator: (value) => value == null || Number.isInteger(value),
        message: 'Rating must be a whole number',
      },
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    likedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    photoUrl: {
      type: String,
      trim: true,
      default: null,
      maxlength: [600000, 'Fotoğraf verisi çok büyük'],
    },
    replies: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          text: {
            type: String,
            required: true,
            trim: true,
            maxlength: [1000, 'Reply cannot exceed 1000 characters'],
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const Comment = mongoose.model('Comment', commentSchema);
