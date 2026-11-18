const { Schema, model } = require('mongoose');

const CITIES = ['Delhi', 'Mumbai', 'Jaipur', 'Bangalore', 'Goa', 'Agra', 'Chennai', 'Hyderabad'];

const hotelSchema = new Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    city:        { type: String, required: true, enum: CITIES },
    address:     { type: String, default: '' },
    description: { type: String, default: '' },
    starRating:  { type: Number, min: 1, max: 5, default: 3 },
    amenities:   [{ type: String }],
    images:      [{ type: String }],
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    checkInTime:  { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' },
    policies:     { type: String, default: '' },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

hotelSchema.index({ city: 1, starRating: -1, isActive: 1 });

module.exports = model('Hotel', hotelSchema);
