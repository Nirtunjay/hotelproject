# DATABASE.md — MongoDB Collection Design

**Project:** StayEase  
**ODM:** Mongoose  
**Hosting:** MongoDB Atlas

---

## Collection Index

1. `users`
2. `hotels`
3. `rooms`
4. `hotel_bookings`
5. `restaurants`
6. `restaurant_tables`
7. `restaurant_reservations`

---

## 1. `users`

```js
{
  _id: ObjectId,
  name: String,            // required, 2-100 chars
  email: String,           // required, unique, lowercase
  password: String,        // bcrypt hash, never returned to client
  phone: String,           // optional, E.164 format
  role: String,            // enum: ["customer", "admin"], default: "customer"
  isActive: Boolean,       // default: true; admin can deactivate
  passwordResetToken: String,     // null unless reset in progress
  passwordResetExpires: Date,
  createdAt: Date,
  updatedAt: Date
}
Indexes: email (unique), role
```

---

## 2. `hotels`

```js
{
  _id: ObjectId,
  name: String,            // required
  slug: String,            // URL-friendly, unique (auto-derived from name + city)
  city: String,            // required; enum of supported cities
  address: String,
  description: String,
  starRating: Number,      // 1-5
  amenities: [String],     // ["WiFi", "Pool", "Spa", ...]
  images: [String],        // Cloudinary URLs or royalty-free URLs
  coordinates: {
    lat: Number,
    lng: Number
  },
  checkInTime: String,     // "14:00"
  checkOutTime: String,    // "11:00"
  policies: String,        // cancellation / check-in policy text
  isActive: Boolean,       // default: true
  createdAt: Date,
  updatedAt: Date
}
Indexes: city, starRating, isActive, slug (unique)
```

---

## 3. `rooms`

```js
{
  _id: ObjectId,
  hotel: ObjectId,         // ref: hotels
  type: String,            // "Deluxe", "Suite", "Standard", etc.
  description: String,
  pricePerNight: Number,   // INR
  capacity: Number,        // max guests
  totalInventory: Number,  // total physical rooms of this type
  amenities: [String],
  images: [String],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
Indexes: hotel, type, isActive
```

> **Availability logic:** Availability for a room type between dates D1–D2 is computed as:
> `totalInventory - COUNT(confirmed hotel_bookings WHERE roomRef = this._id AND dates overlap [D1,D2])`

---

## 4. `hotel_bookings`

```js
{
  _id: ObjectId,
  bookingRef: String,       // unique, e.g. "HTL-2026-A3B2C1"
  user: ObjectId,           // ref: users (required)
  hotel: ObjectId,          // ref: hotels
  room: ObjectId,           // ref: rooms
  checkIn: Date,            // required; must be >= today, < checkOut
  checkOut: Date,           // required
  nights: Number,           // computed: (checkOut - checkIn) / 86400000
  numRooms: Number,         // default: 1
  numGuests: Number,
  guestName: String,
  guestEmail: String,
  guestPhone: String,
  specialRequests: String,
  totalPrice: Number,       // nights × numRooms × pricePerNight
  status: String,           // enum: ["confirmed","cancelled","completed","no_show"]
  paymentStatus: String,    // enum: ["pay_at_property"]; extensible for future gateway
  cancelledAt: Date,
  cancellationReason: String,
  createdAt: Date,
  updatedAt: Date
}
Indexes: user, hotel, room, status, checkIn, checkOut, bookingRef (unique)
```

> **Concurrency guard:** Use `findOneAndUpdate` with `$inc` on a `reservedCount` counter, or a MongoDB transaction on a `room_inventory` document, to prevent double-booking under concurrent requests.

---

## 5. `restaurants`

```js
{
  _id: ObjectId,
  name: String,
  slug: String,             // unique
  city: String,
  address: String,
  description: String,
  cuisine: [String],        // ["North Indian", "Contemporary", ...]
  priceForTwo: Number,      // INR approx
  rating: Number,           // 1-5; admin-managed or computed from reviews
  images: [String],
  openingHours: {
    open: String,           // "12:00" (HH:MM 24h)
    close: String           // "23:00"
  },
  coordinates: { lat: Number, lng: Number },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
Indexes: city, cuisine, isActive, slug (unique)
```

---

## 6. `restaurant_tables`

```js
{
  _id: ObjectId,
  restaurant: ObjectId,     // ref: restaurants
  tableType: String,        // "2-Top", "4-Top", "6-Top", "Private Room", etc.
  capacity: Number,         // max guests per table
  quantity: Number,         // number of tables of this type
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
Indexes: restaurant, tableType
```

---

## 7. `restaurant_reservations`

```js
{
  _id: ObjectId,
  reservationRef: String,   // unique, e.g. "RST-2026-X9Y8Z7"
  user: ObjectId,           // ref: users
  restaurant: ObjectId,     // ref: restaurants
  tableType: ObjectId,      // ref: restaurant_tables
  reservationDate: Date,    // date only (midnight UTC)
  reservationTime: String,  // "19:00" (HH:MM)
  numGuests: Number,
  seatingPreference: String, // "Indoor", "Outdoor", "No Preference"
  guestName: String,
  guestEmail: String,
  guestPhone: String,
  specialRequests: String,
  status: String,            // enum: ["confirmed","cancelled","completed","no_show"]
  cancelledAt: Date,
  createdAt: Date,
  updatedAt: Date
}
Indexes: user, restaurant, reservationDate, reservationTime, status, reservationRef (unique)
```

---

## Availability Logic Summary

### Hotel room availability for a date range [checkIn, checkOut)

```js
const reserved = await HotelBooking.countDocuments({
  room: roomId,
  status: { $in: ["confirmed", "completed"] },
  checkIn: { $lt: checkOut },
  checkOut: { $gt: checkIn }
});
// available units = room.totalInventory - reserved
// (multiply by numRooms requested to check if bookable)
```

### Restaurant table availability for a date + time slot

```js
const reserved = await RestaurantReservation.countDocuments({
  restaurant: restaurantId,
  tableType: tableTypeId,
  reservationDate: date,
  reservationTime: time,
  status: { $in: ["confirmed"] }
});
// available tables = tableType.quantity - reserved
```

---

## Seed Data Strategy

- Seed scripts live in `backend/scripts/seed.js`
- Run with `npm run seed` (dev only)
- Seeds 18 hotels, rooms per hotel, 18 restaurants, tables per restaurant
- Seed data sources from existing `hotel_service.py` and `restaurant_service.py` mock datasets
- Never run seed in production environment (`NODE_ENV !== "production"` guard)
