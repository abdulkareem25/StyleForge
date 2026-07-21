const test = require('node:test');
const assert = require('node:assert/strict');

const { generateOutfits } = require('../src/services/outfitEngine');
const { generateCombinationHash } = require('../src/utils/comboHash');

function createWardrobeItem(overrides = {}) {
  return {
    _id: overrides._id || `item-${Math.random().toString(36).slice(2)}`,
    category: 'top',
    subCategory: 'shirt',
    primaryColor: 'navy',
    fit: 'regular',
    pattern: 'solid',
    formalityTags: ['casual'],
    seasonTags: ['all-season'],
    isActive: true,
    ...overrides,
  };
}

test('returns a repeat-only result when the override is requested for one call', async () => {
  const shirt = createWardrobeItem({ _id: 'shirt-10', category: 'top', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const jeans = createWardrobeItem({ _id: 'bottom-10', category: 'bottom', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const sneakers = createWardrobeItem({ _id: 'footwear-10', category: 'footwear', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const comboHash = generateCombinationHash([shirt._id, jeans._id, sneakers._id]);

  const result = await generateOutfits('user-override', { occasion: 'casual', weather: 'summer', overrideRepeat: true }, {
    findWardrobeItems: async () => [shirt, jeans, sneakers],
    findRecentHistory: async () => [{ combinationHash: comboHash, wornDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }],
    getUserPreferences: async () => null,
  });

  assert.equal(result.usedFallback, false);
  assert.equal(result.resultState, 'repeat-override');
  assert.equal(result.outfits[0].combinationHash, comboHash);
});

test('keeps default generation behavior unchanged when override is not requested', async () => {
  const shirt = createWardrobeItem({ _id: 'shirt-11', category: 'top', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const jeans = createWardrobeItem({ _id: 'bottom-11', category: 'bottom', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const sneakers = createWardrobeItem({ _id: 'footwear-11', category: 'footwear', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const comboHash = generateCombinationHash([shirt._id, jeans._id, sneakers._id]);

  const result = await generateOutfits('user-default', { occasion: 'casual', weather: 'summer' }, {
    findWardrobeItems: async () => [shirt, jeans, sneakers],
    findRecentHistory: async () => [{ combinationHash: comboHash, wornDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }],
    getUserPreferences: async () => null,
  });

  assert.equal(result.usedFallback, true);
  assert.equal(result.resultState, 'all-fresh-exhausted');
  assert.equal(result.overrideRepeat, undefined);
  assert.equal(result.outfits[0].combinationHash, comboHash);
});
