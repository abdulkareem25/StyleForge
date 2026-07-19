const crypto = require('crypto');

function generateCombinationHash(itemIds) {
  const sorted = itemIds.map((id) => id.toString()).sort().join('-');
  return crypto.createHash('sha256').update(sorted).digest('hex');
}

module.exports = { generateCombinationHash };
