import mongoose from 'mongoose';
import { normalizeVenueMenu, venueMenuForClientResponse } from '../utils/venueMenu.js';

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
      type: [mongoose.Schema.Types.Mixed],
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

venueSchema.pre('save', function venueMenuPreSave(next) {
  if (Array.isArray(this.menu)) {
    this.menu = normalizeVenueMenu(this.menu);
  }
  next();
});

function patchMenuInRawUpdate(update) {
  if (!update || typeof update !== 'object') return;
  const target = update.$set && typeof update.$set === 'object' ? update.$set : update;
  if (Array.isArray(target.menu)) {
    target.menu = normalizeVenueMenu(target.menu);
  }
}

venueSchema.pre('findOneAndUpdate', function venueMenuPreFindOneAndUpdate(next) {
  patchMenuInRawUpdate(this.getUpdate());
  next();
});

venueSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    if (Array.isArray(ret.menu)) {
      ret.menu = venueMenuForClientResponse(ret.menu);
    }
    return ret;
  },
});

export const Venue = mongoose.model('Venue', venueSchema);
