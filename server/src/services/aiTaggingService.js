const User = require('../models/User');

// Placeholder — aiTaggingService.js (Gemini calls + prompt templates)
// Will be implemented in the wardrobe upload ticket

/**
 * Processes AI tagging results for a wardrobe item.
 * Includes a guard to discard results for soft-deleted users (AUTH-05, Security doc §8).
 * @param {string} userId
 * @param {string} itemId
 * @param {object} taggingResult - AI-generated tags
 * @returns {Promise<object|null>} Updated item or null if user was deleted
 */
const applyTaggingResult = async (userId, itemId, taggingResult) => {
  // Guard: discard results for deleted users (AUTH-05)
  const user = await User.findById(userId).setOptions({ withDeleted: true });
  if (!user || user.deletedAt) {
    console.warn(`Discarding AI tagging result for deleted user ${userId}, item ${itemId}`);
    return null;
  }

  // When wardrobe service is implemented, this will update the WardrobeItem
  // For now, return the tagging result for the caller to handle
  return taggingResult;
};

module.exports = {
  tagImage: async (_imageUrl) => {
    throw new Error('Not implemented — see wardrobe upload ticket');
  },
  applyTaggingResult,
};
