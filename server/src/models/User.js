const mongoose = require('mongoose');

const GRACE_PERIOD_DAYS = 30;

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  stylePreferences: {
    preferredColors: [{ type: String }],
    fitPreference: { type: String, enum: ['regular', 'slim', 'oversized', 'relaxed'], default: 'regular' },
    printTolerance: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpiry: { type: Date, default: null },
  passwordResetToken: { type: String, default: null },
  passwordResetExpiry: { type: Date, default: null },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

// Auto-filter soft-deleted users from normal queries.
// Use .setOptions({ withDeleted: true }) to include them (e.g. login restoration).
userSchema.pre(/^find/, function (next) {
  if (!this.options.withDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

userSchema.statics.GRACE_PERIOD_DAYS = GRACE_PERIOD_DAYS;

module.exports = mongoose.model('User', userSchema);
