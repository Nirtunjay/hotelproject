const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { err } = require('../utils/apiResponse');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return err(res, 'Authentication required', 401);

  try {
    req.user = jwt.verify(header.slice(7), jwtSecret);
    next();
  } catch {
    return err(res, 'Invalid or expired token', 401);
  }
};
