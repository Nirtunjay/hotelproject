const { Schema, model } = require('mongoose');

const roomSchema = new Schema(
  {
    hotel:          { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    type:           { type: String, required: true, trim: true },
    description:    { type: String, default: '' },
    pricePerNight:  { type: Number, required: true, min: 0 },
    capacity:       { type: Number, required: true, min: 1 },
    totalInventory: { type: Number, required: true, min: 1 },
    amenities:      [{ type: String }],
    images:         [{ type: String }],
    isActive:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomSchema.index({ hotel: 1, isActive: 1 });

module.exports = model('Room', roomSchema);
