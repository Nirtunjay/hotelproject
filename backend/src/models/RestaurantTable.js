const { Schema, model } = require('mongoose');

const restaurantTableSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    tableType:  { type: String, required: true, trim: true }, // "2-Top", "4-Top", etc.
    capacity:   { type: Number, required: true, min: 1 },
    quantity:   { type: Number, required: true, min: 1 },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

restaurantTableSchema.index({ restaurant: 1, isActive: 1 });

module.exports = model('RestaurantTable', restaurantTableSchema);
