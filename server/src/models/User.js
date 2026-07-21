const mongoose = require('mongoose');
const { fitPreferences, printTolerances } = require('../constants/categories');

const GRACE_PERIOD_DAYS = 30;

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  stylePreferences: {
    preferredColors: [{ type: String }],
    fitPreference: { type: String, enum: fitPreferences, default: 'regular' },
    printTolerance: { type: String, enum: printTolerances, default: 'medium' },
    remindersEnabled: { type: Boolean, default: false },
    reminderTime: { type: String, default: null },
    reminderUnsubToken: { type: String, default: null },
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
