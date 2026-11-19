const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { ok, err, created } = require('../utils/apiResponse');
const {
  jwtSecret, jwtExpiresIn,
  refreshSecret, refreshExpiresIn,
} = require('../config/env');

// ── Helpers ───────────────────────────────────────────────────────────────────

const signAccess   = (id, role) => jwt.sign({ id, role }, jwtSecret,    { expiresIn: jwtExpiresIn });
const signRefresh  = (id)       => jwt.sign({ id },       refreshSecret, { expiresIn: refreshExpiresIn });

// Strip password from plain object (guard against accidental leaks)
const safeUser = (u) => {
  const { password: _pw, ...safe } = u.toObject ? u.toObject() : u;
  return safe;
};

// ── Controllers ───────────────────────────────────────────────────────────────

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (await User.exists({ email }))
      return err(res, 'Email is already registered', 409);

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash });

    const token        = signAccess(user._id, user.role);
    const refreshToken = signRefresh(user._id);

    return created(res, { token, refreshToken, user: safeUser(user) });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // select('+password') because the field is excluded by default in the schema
    const user = await User.findOne({ email }).select('+password');
    if (!user) return err(res, 'Invalid email or password', 401);

    if (!user.isActive)
      return err(res, 'Your account has been deactivated. Contact support.', 403);

    const match = await bcrypt.compare(password, user.password);
    if (!match) return err(res, 'Invalid email or password', 401);

    const token        = signAccess(user._id, user.role);
    const refreshToken = signRefresh(user._id);

    return ok(res, { token, refreshToken, user: safeUser(user) });
  } catch (e) { next(e); }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return err(res, 'Refresh token required', 400);

    let payload;
    try {
      payload = jwt.verify(refreshToken, refreshSecret);
    } catch {
      return err(res, 'Invalid or expired refresh token', 401);
    }

    const user = await User.findById(payload.id);
    if (!user || !user.isActive) return err(res, 'User not found or inactive', 401);

    return ok(res, { token: signAccess(user._id, user.role) });
  } catch (e) { next(e); }
};

exports.getMe = async (req, res, next) => {
  try {
    // req.user is set by auth middleware (contains { id, role })
    const user = await User.findById(req.user.id);
    if (!user) return err(res, 'User not found', 404);
    return ok(res, safeUser(user));
  } catch (e) { next(e); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (name)  updates.name  = name;
    if (phone !== undefined) updates.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );
    return ok(res, safeUser(user));
  } catch (e) { next(e); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return err(res, 'Current password is incorrect', 400);

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return ok(res, { message: 'Password changed successfully' });
  } catch (e) { next(e); }
};

// ── Stubs: email service not configured ───────────────────────────────────────

exports.forgotPassword = (_req, res) =>
  // shortcut: no email sending; always returns generic message, when to upgrade: wire nodemailer/sendgrid
  ok(res, { message: 'If that email is registered, a reset link will be sent.' });

exports.resetPassword = (_req, res) =>
  res.status(501).json({ success: false, error: 'Email service not configured. Reset is unavailable.' });
