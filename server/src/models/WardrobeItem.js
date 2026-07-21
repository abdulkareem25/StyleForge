const mongoose = require('mongoose');
const {
  categories,
  sleeveLengths,
  fits,
  patterns,
  formalityTags,
  seasonTags,
} = require('../constants/categories');

const wardrobeItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  imageUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  category: {
    type: String,
    enum: categories,
    required: true,
  },
  subCategory: { type: String, required: true },
  sleeveLength: { type: String, enum: sleeveLengths, default: 'n/a' },
  fit: { type: String, enum: fits, default: 'regular' },
  primaryColor: { type: String, required: true },
  secondaryColor: { type: String },
  pattern: { type: String, enum: patterns, default: 'solid' },
  formalityTags: [{ type: String, enum: formalityTags }],
  seasonTags: [{ type: String, enum: seasonTags }],
  isActive: { type: Boolean, default: true, index: true },
  aiTagConfidence: { type: Number },
  userCorrected: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('WardrobeItem', wardrobeItemSchema);
