const mongoose = require('mongoose');

/**
 * Geo-spatial sorgular ($geoNear) için GeoJSON Point kullanın:
 * geoLocation: { type: 'Point', coordinates: [longitude, latitude] }
 * Eski kayıtlarda sadece location.latitude/longitude varsa, kayıt güncellenene kadar
 * veya geoLocation senkronize edilene kadar yakın arama sonuç vermeyebilir.
 */
const venueSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    photos: [{ type: String, trim: true }],
    opening_hours: { type: mongoose.Schema.Types.Mixed, default: null },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    geoLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        validate: {
          validator(v) {
            return !v || v.length === 2;
          },
          message: 'coordinates [lng, lat] olmalıdır',
        },
      },
    },
    menu: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

venueSchema.index({ geoLocation: '2dsphere' }, { sparse: true });

venueSchema.pre('save', function syncGeoLocation(next) {
  const lat = this.location?.latitude;
  const lng = this.location?.longitude;
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  ) {
    this.geoLocation = { type: 'Point', coordinates: [lng, lat] };
  }
  next();
});

module.exports = mongoose.model('Venue', venueSchema);
