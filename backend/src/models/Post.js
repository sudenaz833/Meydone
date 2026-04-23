import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Post text is required'],
      trim: true,
      maxlength: [1000, 'Post text cannot exceed 1000 characters'],
    },
    photoUrl: {
      type: String,
      trim: true,
      default: null,
      maxlength: [600000, 'Fotoğraf verisi çok büyük'],
    },
    locationLat: {
      type: Number,
      default: null,
    },
    locationLng: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true },
);

export const Post = mongoose.model('Post', postSchema);
