const { Schema, model } = require('mongoose');

const CITIES = ['Delhi', 'Mumbai', 'Jaipur', 'Bangalore', 'Goa', 'Agra', 'Chennai', 'Hyderabad'];

const restaurantSchema = new Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    city:        { type: String, required: true, enum: CITIES },
    address:     { type: String, default: '' },
    description: { type: String, default: '' },
    cuisine:     [{ type: String }],
    priceForTwo: { type: Number, default: 0 },
    rating:      { type: Number, min: 0, max: 5, default: 0 },
    images:      [{ type: String }],
    openingHours: {
      open:  { type: String, default: '10:00' }, // HH:MM 24h
      close: { type: String, default: '22:00' },
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

restaurantSchema.index({ city: 1, isActive: 1 });

module.exports = model('Restaurant', restaurantSchema);
