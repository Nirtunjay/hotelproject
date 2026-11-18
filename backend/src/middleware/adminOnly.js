const { err } = require('../utils/apiResponse');

module.exports = (req, res, next) => {
  if (req.user?.role !== 'admin') return err(res, 'Admin access required', 403);
  next();
};
