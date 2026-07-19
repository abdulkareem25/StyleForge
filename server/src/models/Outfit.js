const mongoose = require('mongoose');

const outfitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WardrobeItem', required: true }],
  combinationHash: { type: String, required: true },
  isFavorite: { type: Boolean, default: false },
}, { timestamps: true });

outfitSchema.index({ userId: 1, combinationHash: 1 }, { unique: true });

module.exports = mongoose.model('Outfit', outfitSchema);
