const mongoose = require('mongoose');

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
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
