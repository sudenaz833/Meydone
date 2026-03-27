import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
      maxlength: [120, 'Venue name cannot exceed 120 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [80, 'Category cannot exceed 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    location: {
      lat: {
        type: Number,
        default: null,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      lng: {
        type: Number,
        default: null,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
    },
    address: {
      city: {
        type: String,
        trim: true,
        default: '',
        maxlength: [120, 'City cannot exceed 120 characters'],
      },
      district: {
        type: String,
        trim: true,
        default: '',
        maxlength: [120, 'District cannot exceed 120 characters'],
      },
      neighborhood: {
        type: String,
        trim: true,
        default: '',
        maxlength: [120, 'Neighborhood cannot exceed 120 characters'],
      },
      street: {
        type: String,
        trim: true,
        default: '',
        maxlength: [160, 'Street cannot exceed 160 characters'],
      },
      details: {
        type: String,
        trim: true,
        default: '',
        maxlength: [240, 'Address details cannot exceed 240 characters'],
      },
    },
    menu: {
      type: [String],
      default: [],
    },
    hours: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be between 0 and 5'],
      max: [5, 'Rating must be between 0 and 5'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    photoUrl: {
      type: String,
      trim: true,
      default: null,
      maxlength: [600000, 'Fotoğraf verisi çok büyük'],
    },
    announcement: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Duyuru en fazla 500 karakter olabilir'],
    },
    announcements: {
      type: [
        {
          text: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, 'Duyuru en fazla 500 karakter olabilir'],
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

export const Venue = mongoose.model('Venue', venueSchema);
