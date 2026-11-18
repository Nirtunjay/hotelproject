const { Schema, model } = require('mongoose');

const restaurantReservationSchema = new Schema(
  {
    reservationRef:  { type: String, required: true, unique: true },
    user:            { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant:      { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    tableType:       { type: Schema.Types.ObjectId, ref: 'RestaurantTable', required: true },
    reservationDate: { type: Date, required: true },   // midnight UTC of the booking date
    reservationTime: { type: String, required: true }, // "19:00" HH:MM
    numGuests:       { type: Number, required: true, min: 1 },
    seatingPreference: { type: String, enum: ['Indoor', 'Outdoor', 'No Preference'], default: 'No Preference' },
    guestName:       { type: String, required: true, trim: true },
    guestEmail:      { type: String, required: true, lowercase: true, trim: true },
    guestPhone:      { type: String, default: '' },
    specialRequests: { type: String, default: '' },
    status:          { type: String, enum: ['confirmed', 'cancelled', 'completed', 'no_show'], default: 'confirmed' },
    cancelledAt:     { type: Date },
  },
  { timestamps: true }
);

restaurantReservationSchema.index({ user: 1, status: 1 });
restaurantReservationSchema.index({ restaurant: 1, reservationDate: 1, reservationTime: 1 }); // availability query

module.exports = model('RestaurantReservation', restaurantReservationSchema);
