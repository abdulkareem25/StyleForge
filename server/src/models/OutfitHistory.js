const mongoose = require('mongoose');
const { seasonTags } = require('../constants/categories');

const outfitHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  outfitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outfit', required: true, index: true },
  occasionTag: { type: String, required: true },
  weatherContext: { type: String, enum: [...seasonTags, 'any'] },
  wornDate: { type: Date, required: true, default: Date.now, index: true },
}, { timestamps: true });

module.exports = mongoose.model('OutfitHistory', outfitHistorySchema);
