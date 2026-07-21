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

test('treats repeats at the combination level and keeps a distinct combo fresh', async () => {
  const shirt = createWardrobeItem({ _id: 'shirt-1', category: 'top', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const officeShirt = createWardrobeItem({ _id: 'shirt-2', category: 'top', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const jeans = createWardrobeItem({ _id: 'bottom-1', category: 'bottom', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const trousers = createWardrobeItem({ _id: 'bottom-2', category: 'bottom', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const sneakers = createWardrobeItem({ _id: 'footwear-1', category: 'footwear', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });

  const history = [
    {
      combinationHash: generateCombinationHash([shirt._id, jeans._id, sneakers._id]),
      wornDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  const result = await generateOutfits('user-1', { occasion: 'casual', weather: 'summer' }, {
    findWardrobeItems: async () => [shirt, officeShirt, jeans, trousers, sneakers],
    findRecentHistory: async () => history,
    getUserPreferences: async () => null,
  });

  assert.equal(result.usedFallback, false);
  assert.equal(result.resultState, 'success');
  assert.ok(result.outfits.length >= 1);
  assert.ok(result.outfits.some((outfit) => outfit.itemIds.includes(officeShirt._id)));
});

test('falls back to the least-recently-worn combination when every fresh combo is exhausted', async () => {
  const shirt = createWardrobeItem({ _id: 'shirt-3', category: 'top', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const jeans = createWardrobeItem({ _id: 'bottom-3', category: 'bottom', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const sneakers = createWardrobeItem({ _id: 'footwear-3', category: 'footwear', formalityTags: ['casual'], seasonTags: ['summer', 'all-season'] });
  const comboHash = generateCombinationHash([shirt._id, jeans._id, sneakers._id]);

  const result = await generateOutfits('user-2', { occasion: 'casual', weather: 'summer' }, {
    findWardrobeItems: async () => [shirt, jeans, sneakers],
    findRecentHistory: async () => [{ combinationHash: comboHash, wornDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }],
    getUserPreferences: async () => null,
  });

  assert.equal(result.usedFallback, true);
  assert.equal(result.resultState, 'all-fresh-exhausted');
  assert.equal(result.outfits[0].combinationHash, comboHash);
  assert.deepEqual(result.outfits[0].itemIds.sort(), [shirt._id, jeans._id, sneakers._id].sort());
});

test('reports no eligible items when hard filters leave nothing to consider', async () => {
  const shirt = createWardrobeItem({ _id: 'shirt-4', category: 'top', formalityTags: ['office'], seasonTags: ['winter'] });
  const jeans = createWardrobeItem({ _id: 'bottom-4', category: 'bottom', formalityTags: ['formal'], seasonTags: ['all-season'] });
  const sneakers = createWardrobeItem({ _id: 'footwear-4', category: 'footwear', formalityTags: ['formal'], seasonTags: ['winter'] });

  const result = await generateOutfits('user-3', { occasion: 'casual', weather: 'summer' }, {
    findWardrobeItems: async () => [shirt, jeans, sneakers],
    findRecentHistory: async () => [],
    getUserPreferences: async () => null,
  });

  assert.equal(result.usedFallback, false);
  assert.equal(result.resultState, 'no-eligible-items');
  assert.deepEqual(result.outfits, []);
});
