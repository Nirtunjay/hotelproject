const Hotel       = require('../models/Hotel');
const Room        = require('../models/Room');
const HotelBooking = require('../models/HotelBooking');
const { slugify } = require('../utils/slugify');
const { ok, err, created } = require('../utils/apiResponse');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Count confirmed/completed bookings overlapping [checkIn, checkOut) for a room.
 * Uses the index on { room, checkIn, checkOut }.
 */
async function countOverlapping(roomId, checkIn, checkOut) {
  return HotelBooking.countDocuments({
    room:   roomId,
    status: { $in: ['confirmed', 'completed'] },
    checkIn:  { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });
}

// ── Public ────────────────────────────────────────────────────────────────────

/**
 * GET /api/hotels
 * Query: city, minStars, maxPrice, amenities (CSV), page, limit
 * Availability filter (checkIn, checkOut, guests, rooms) applied in memory
 * after fetching hotels — full date availability requires room-level queries
 * and is deferred to the hotel detail + room endpoints.
 */
exports.listHotels = async (req, res, next) => {
  try {
    const { city, minStars, maxPrice, amenities, page = 1, limit = 12 } = req.query;

    const filter = { isActive: true };
    if (city)     filter.city = city;
    if (minStars) filter.starRating = { $gte: Number(minStars) };
    if (amenities) {
      const list = amenities.split(',').map(a => a.trim()).filter(Boolean);
      if (list.length) filter.amenities = { $all: list };
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(50, Number(limit));
    const take = Math.min(50, Number(limit));

    // Attach cheapest room price per hotel for filtering/display
    const [hotels, total] = await Promise.all([
      Hotel.find(filter).sort({ starRating: -1, _id: 1 }).skip(skip).limit(take).lean(),
      Hotel.countDocuments(filter),
    ]);

    // Enrich each hotel with its min room price
    const hotelIds = hotels.map(h => h._id);
    const rooms = await Room.find({ hotel: { $in: hotelIds }, isActive: true })
      .select('hotel pricePerNight capacity')
      .lean();

    const minPrice = {};
    for (const r of rooms) {
      const id = r.hotel.toString();
      if (minPrice[id] === undefined || r.pricePerNight < minPrice[id]) {
        minPrice[id] = r.pricePerNight;
      }
    }

    let result = hotels.map(h => ({ ...h, minRoomPrice: minPrice[h._id.toString()] ?? null }));

    // Post-filter by maxPrice (cheapest room must be ≤ maxPrice)
    if (maxPrice) {
      result = result.filter(h => h.minRoomPrice !== null && h.minRoomPrice <= Number(maxPrice));
    }

    return ok(res, {
      hotels: result,
      pagination: { page: Number(page), limit: take, total, pages: Math.ceil(total / take) },
    });
  } catch (e) { next(e); }
};

/**
 * GET /api/hotels/popular
 * Top 6 active hotels by starRating desc, then by min room price asc.
 */
exports.getPopular = async (req, res, next) => {
  try {
    const hotels = await Hotel.find({ isActive: true })
      .sort({ starRating: -1 })
      .limit(6)
      .lean();

    const hotelIds = hotels.map(h => h._id);
    const rooms = await Room.find({ hotel: { $in: hotelIds }, isActive: true })
      .select('hotel pricePerNight')
      .lean();

    const minPrice = {};
    for (const r of rooms) {
      const id = r.hotel.toString();
      if (minPrice[id] === undefined || r.pricePerNight < minPrice[id]) minPrice[id] = r.pricePerNight;
    }

    return ok(res, hotels.map(h => ({ ...h, minRoomPrice: minPrice[h._id.toString()] ?? null })));
  } catch (e) { next(e); }
};

/**
 * GET /api/hotels/:id
 * Returns hotel + its active rooms, each room enriched with available count
 * when checkIn/checkOut query params are provided.
 */
exports.getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id).lean();
    if (!hotel || !hotel.isActive) return err(res, 'Hotel not found', 404);

    const rooms = await Room.find({ hotel: hotel._id, isActive: true }).lean();

    const { checkIn, checkOut } = req.query;
    const ciDate = checkIn  ? new Date(checkIn)  : null;
    const coDate = checkOut ? new Date(checkOut) : null;

    // If dates supplied, attach real-time availability per room
    let enrichedRooms = rooms;
    if (ciDate && coDate && ciDate < coDate) {
      enrichedRooms = await Promise.all(rooms.map(async (room) => {
        const reserved = await countOverlapping(room._id, ciDate, coDate);
        return { ...room, availableRooms: Math.max(0, room.totalInventory - reserved) };
      }));
    }

    return ok(res, { hotel, rooms: enrichedRooms });
  } catch (e) { next(e); }
};

// ── Admin CRUD ────────────────────────────────────────────────────────────────

exports.createHotel = async (req, res, next) => {
  try {
    const { name, city, address, description, starRating, amenities, images,
            coordinates, checkInTime, checkOutTime, policies } = req.body;

    if (!name || !city) return err(res, 'name and city are required', 400);

    const slug = slugify(name) + '-' + Date.now().toString(36);
    const hotel = await Hotel.create({
      name, slug, city, address, description, starRating,
      amenities, images, coordinates, checkInTime, checkOutTime, policies,
    });
    return created(res, hotel);
  } catch (e) { next(e); }
};

exports.updateHotel = async (req, res, next) => {
  try {
    const allowed = ['name', 'city', 'address', 'description', 'starRating',
      'amenities', 'images', 'coordinates', 'checkInTime', 'checkOutTime', 'policies', 'isActive'];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!hotel) return err(res, 'Hotel not found', 404);
    return ok(res, hotel);
  } catch (e) { next(e); }
};

exports.deactivateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!hotel) return err(res, 'Hotel not found', 404);
    return ok(res, { message: 'Hotel deactivated', hotel });
  } catch (e) { next(e); }
};
