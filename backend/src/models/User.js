const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name:  { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // never returned by default
    phone: { type: String, default: '' },
    role:  { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isActive: { type: Boolean, default: true },
    // shortcut: no refresh-token rotation store; upgrade to DB-stored tokens for multi-device revocation
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

module.exports = model('User', userSchema);
