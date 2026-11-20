const router = require('express').Router();
const { body, query } = require('express-validator');
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const validate  = require('../middleware/validate');
const h         = require('../controllers/hotel.controller');
const r         = require('../controllers/room.controller');

// ── Validation helpers ────────────────────────────────────────────────────────

const vCreateHotel = [
  body('name').trim().notEmpty().withMessage('Hotel name required'),
  body('city').notEmpty().withMessage('City required'),
  body('starRating').optional().isFloat({ min: 1, max: 5 }).withMessage('starRating 1-5'),
];

const vUpdateHotel = [
  body('starRating').optional().isFloat({ min: 1, max: 5 }),
  body('isActive').optional().isBoolean(),
];

const vCreateRoom = [
  body('type').trim().notEmpty().withMessage('Room type required'),
  body('pricePerNight').isFloat({ min: 0 }).withMessage('pricePerNight must be ≥ 0'),
  body('capacity').isInt({ min: 1 }).withMessage('capacity must be ≥ 1'),
  body('totalInventory').isInt({ min: 1 }).withMessage('totalInventory must be ≥ 1'),
];

// ── Public routes ─────────────────────────────────────────────────────────────

// /api/hotels/popular must come before /api/hotels/:id — Express matches top-down
router.get('/popular', h.getPopular);
router.get('/',        h.listHotels);
router.get('/:id',     h.getHotel);

// Room routes — public: list + availability
router.get('/:hotelId/rooms',                              r.listRooms);
router.get('/:hotelId/rooms/:roomId/availability',         r.checkAvailability);

// ── Admin routes (auth + adminOnly on every endpoint) ────────────────────────

router.post  ('/',      auth, adminOnly, vCreateHotel, validate, h.createHotel);
router.put   ('/:id',   auth, adminOnly, vUpdateHotel, validate, h.updateHotel);
router.delete('/:id',   auth, adminOnly, h.deactivateHotel);

router.post('/:hotelId/rooms',           auth, adminOnly, vCreateRoom, validate, r.createRoom);
router.put ('/:hotelId/rooms/:roomId',   auth, adminOnly, r.updateRoom);

module.exports = router;
