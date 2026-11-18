const { Schema, model } = require('mongoose');

const hotelBookingSchema = new Schema(
  {
    bookingRef:    { type: String, required: true, unique: true },
    user:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hotel:         { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    room:          { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    checkIn:       { type: Date, required: true },
    checkOut:      { type: Date, required: true },
    nights:        { type: Number, required: true, min: 1 },
    numRooms:      { type: Number, default: 1, min: 1 },
    numGuests:     { type: Number, required: true, min: 1 },
    guestName:     { type: String, required: true, trim: true },
    guestEmail:    { type: String, required: true, lowercase: true, trim: true },
    guestPhone:    { type: String, default: '' },
    specialRequests: { type: String, default: '' },
    totalPrice:    { type: Number, required: true, min: 0 },
    status:        { type: String, enum: ['confirmed', 'cancelled', 'completed', 'no_show'], default: 'confirmed' },
    paymentStatus: { type: String, enum: ['pay_at_property'], default: 'pay_at_property' },
    cancelledAt:         { type: Date },
    cancellationReason:  { type: String, default: '' },
  },
  { timestamps: true }
);

hotelBookingSchema.index({ user: 1, status: 1 });
hotelBookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 }); // availability query

module.exports = model('HotelBooking', hotelBookingSchema);
