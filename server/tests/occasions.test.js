const test = require('node:test');
const assert = require('node:assert/strict');

const {
  occasionGroups,
  standardOccasions,
  getOccasionMatchStrategy,
  validateCustomOccasion,
} = require('../src/constants/occasions');

test('defines the full 18-occasion taxonomy grouped exactly as specified', () => {
  assert.deepEqual(occasionGroups.map((group) => group.name), [
    'Everyday',
    'Work',
    'Celebrations',
    'Going Out',
    'Away',
    'Active',
  ]);

  assert.deepEqual(occasionGroups.flatMap((group) => group.occurrences.map((occurrence) => occurrence.label)), [
    'Casual',
    'Smart Casual',
    'Home Wear',
    'College',
    'Business Casual',
    'Professional Office',
    'Meetings',
    'Interviews',
    'Weddings',
    'Festivals',
    'Religious Events',
    'Family Gatherings',
    'Parties',
    'Dates',
    'Night Out',
    'Travel',
    'Vacation',
    'Gym',
  ]);

  assert.equal(standardOccasions.length, 18);
  assert.deepEqual(standardOccasions, occasionGroups.flatMap((group) => group.occurrences.map((occurrence) => occurrence.label)));
});

test('treats custom occasions as soft matches without hard-filtering formality tags', () => {
  const strategy = getOccasionMatchStrategy('Beach brunch for family');
  assert.equal(strategy.mode, 'soft');
  assert.deepEqual(strategy.formalityTags, []);
});

test('rejects custom occasion text that contains HTML or script content', () => {
  const invalid = validateCustomOccasion('<script>alert(1)</script>');
  assert.equal(invalid.isValid, false);
  assert.match(invalid.error, /HTML/i);
});

test('accepts reasonable custom occasion text and trims it safely', () => {
  const result = validateCustomOccasion('   Garden party for cousins   ');
  assert.equal(result.isValid, true);
  assert.equal(result.value, 'Garden party for cousins');
});
