require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { corsOrigin, nodeEnv } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── NoSQL injection sanitization ─────────────────────────────────────────────
app.use(mongoSanitize());

// ── Logging (dev only) ───────────────────────────────────────────────────────
if (nodeEnv === 'development') app.use(morgan('dev'));

// ── Global rate limit (100 req / 15 min per IP) ──────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
}));

// ── Health check (no auth) ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ success: true, data: { status: 'ok', version: '1.0.0' } })
);

// ── Route stubs (populated phase by phase) ───────────────────────────────────
// Phase 4: auth routes
app.use('/api/auth',              require('./routes/auth.routes'));
// Phase 5: hotel + room routes
// app.use('/api/hotels',            require('./routes/hotel.routes'));
// Phase 7: booking routes
// app.use('/api/bookings/hotel',    require('./routes/hotelBooking.routes'));
// Phase 8: restaurant + reservation routes
// app.use('/api/restaurants',       require('./routes/restaurant.routes'));
// app.use('/api/reservations',      require('./routes/restaurantReservation.routes'));
// Phase 9: user + admin routes
// app.use('/api/users',             require('./routes/user.routes'));
// app.use('/api/admin',             require('./routes/admin.routes'));

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ── Centralized error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

module.exports = app;
