const router = require('express').Router();
const { body } = require('express-validator');
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');
const c        = require('../controllers/auth.controller');

// ── Validation chains ─────────────────────────────────────────────────────────

const vRegister = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const vLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const vChangePassword = [
  body('oldPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

const vUpdateMe = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

router.post('/register',         vRegister,       validate, c.register);
router.post('/login',            vLogin,          validate, c.login);
router.post('/refresh',          c.refresh);
router.post('/forgot-password',  c.forgotPassword);
router.post('/reset-password',   c.resetPassword);

router.get ('/me',               auth, c.getMe);
router.put ('/me',               auth, vUpdateMe,       validate, c.updateMe);
router.put ('/me/password',      auth, vChangePassword, validate, c.changePassword);

module.exports = router;
