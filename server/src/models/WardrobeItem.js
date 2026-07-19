const mongoose = require('mongoose');

const wardrobeItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  imageUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  category: {
    type: String,
    enum: ['top', 'bottom', 'ethnic', 'outerwear', 'footwear', 'accessory'],
    required: true,
  },
  subCategory: { type: String, required: true },
  sleeveLength: { type: String, enum: ['full', 'half', 'sleeveless', 'n/a'], default: 'n/a' },
  fit: { type: String, enum: ['regular', 'slim', 'oversized', 'relaxed'], default: 'regular' },
  primaryColor: { type: String, required: true },
  secondaryColor: { type: String },
  pattern: { type: String, enum: ['solid', 'striped', 'checked', 'printed', 'other'], default: 'solid' },
  formalityTags: [{ type: String, enum: ['casual', 'office', 'formal', 'ethnic', 'party', 'gym', 'travel', 'date', 'festival'] }],
  seasonTags: [{ type: String, enum: ['summer', 'winter', 'monsoon', 'all-season'] }],
  isActive: { type: Boolean, default: true, index: true },
  aiTagConfidence: { type: Number },
  userCorrected: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('WardrobeItem', wardrobeItemSchema);
