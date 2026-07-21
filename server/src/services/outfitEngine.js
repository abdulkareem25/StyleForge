const { getOccasionMatchStrategy } = require('../constants/occasions');

function buildOccasionFilter(occasion) {
  const strategy = getOccasionMatchStrategy(occasion);
  if (strategy.mode === 'hard') {
    return { formalityTags: { $in: strategy.formalityTags } };
  }
  return null;
}

// Placeholder — outfitEngine.js (core combinatorial + repetition logic)
// Will be implemented in the outfit generation ticket (TAD §8)

module.exports = {
  buildOccasionFilter,
  generateOutfits: async (_userId, _options) => {
    throw new Error('Not implemented — see outfit generation ticket');
  },
};
