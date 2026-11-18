// Centralized error middleware — must be registered last in app.js
module.exports = (error, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.url} →`, error.message);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return res.status(422).json({ success: false, error: Object.values(error.errors).map(e => e.message).join('; ') });
  }
  // Mongoose duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(409).json({ success: false, error: `${field} already exists` });
  }
  // JWT errors surfaced manually are already handled in auth.js; this catches the rest
  const status = error.status || error.statusCode || 500;
  res.status(status).json({ success: false, error: error.message || 'Internal server error' });
};
