const { validationResult } = require('express-validator');
const { err } = require('../utils/apiResponse');

// Drop this after any express-validator chain to catch failures
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return err(res, errors.array().map(e => e.msg).join('; '), 422);
  }
  next();
};
