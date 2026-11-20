const Room         = require('../models/Room');
const Hotel        = require('../models/Hotel');
const HotelBooking = require('../models/HotelBooking');
const { ok, err, created } = require('../utils/apiResponse');

// ── Availability helper (shared query pattern from DATABASE.md) ───────────────

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
 * GET /api/hotels/:hotelId/rooms
 * Lists active rooms for a hotel. Accepts checkIn/checkOut query params
 * to include real-time availableRooms count per room.
 */
exports.listRooms = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId).lean();
    if (!hotel || !hotel.isActive) return err(res, 'Hotel not found', 404);

    const rooms = await Room.find({ hotel: hotel._id, isActive: true }).lean();

    const { checkIn, checkOut } = req.query;
    const ciDate = checkIn  ? new Date(checkIn)  : null;
    const coDate = checkOut ? new Date(checkOut) : null;

    if (ciDate && coDate && ciDate < coDate) {
      const enriched = await Promise.all(rooms.map(async (room) => {
        const reserved = await countOverlapping(room._id, ciDate, coDate);
        return { ...room, availableRooms: Math.max(0, room.totalInventory - reserved) };
      }));
      return ok(res, enriched);
    }

    return ok(res, rooms);
  } catch (e) { next(e); }
};

/**
 * GET /api/hotels/:hotelId/rooms/:roomId/availability
 * Body/query: checkIn, checkOut, numRooms
 * Returns { available: bool, availableRooms: N, totalInventory: N }
 * Never trusts frontend for availability — always recomputes from DB.
 */
exports.checkAvailability = async (req, res, next) => {
  try {
    const { checkIn, checkOut, numRooms = 1 } = req.query;

    if (!checkIn || !checkOut) return err(res, 'checkIn and checkOut are required', 400);

    const ciDate = new Date(checkIn);
    const coDate = new Date(checkOut);
    const now    = new Date();

    if (isNaN(ciDate) || isNaN(coDate)) return err(res, 'Invalid date format', 400);
    if (ciDate <= now)   return err(res, 'Check-in must be a future date', 400);
    if (coDate <= ciDate) return err(res, 'Check-out must be after check-in', 400);

    const room = await Room.findOne({ _id: req.params.roomId, hotel: req.params.hotelId, isActive: true });
    if (!room) return err(res, 'Room not found', 404);

    const reserved      = await countOverlapping(room._id, ciDate, coDate);
    const availableRooms = Math.max(0, room.totalInventory - reserved);
    const requested      = Math.max(1, Number(numRooms));

    return ok(res, {
      available:      availableRooms >= requested,
      availableRooms,
      totalInventory: room.totalInventory,
      requested,
    });
  } catch (e) { next(e); }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

exports.createRoom = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId);
    if (!hotel) return err(res, 'Hotel not found', 404);

    const { type, description, pricePerNight, capacity, totalInventory, amenities, images } = req.body;
    if (!type || !pricePerNight || !capacity || !totalInventory)
      return err(res, 'type, pricePerNight, capacity, and totalInventory are required', 400);

    const room = await Room.create({
      hotel: hotel._id, type, description,
      pricePerNight: Number(pricePerNight),
      capacity:       Number(capacity),
      totalInventory: Number(totalInventory),
      amenities, images,
    });
    return created(res, room);
  } catch (e) { next(e); }
};

exports.updateRoom = async (req, res, next) => {
  try {
    const allowed = ['type', 'description', 'pricePerNight', 'capacity', 'totalInventory', 'amenities', 'images', 'isActive'];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    const room = await Room.findOneAndUpdate(
      { _id: req.params.roomId, hotel: req.params.hotelId },
      updates,
      { new: true, runValidators: true }
    );
    if (!room) return err(res, 'Room not found', 404);
    return ok(res, room);
  } catch (e) { next(e); }
};
