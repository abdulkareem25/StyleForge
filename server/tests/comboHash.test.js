const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const { generateCombinationHash } = require('../src/utils/comboHash');

test('generates the same SHA-256 hash regardless of item order', () => {
  const first = generateCombinationHash([42, 'shirt', 7]);
  const second = generateCombinationHash(['7', 'shirt', 42]);

  assert.equal(first, second);
});

test('uses a deterministic SHA-256 digest from the sorted item-id list', () => {
  const expected = crypto.createHash('sha256').update('1-2-3').digest('hex');
  const actual = generateCombinationHash([3, 2, 1]);

  assert.equal(actual, expected);
  assert.match(actual, /^[a-f0-9]{64}$/);
});

test('returns a different hash when the item set changes', () => {
  assert.notEqual(generateCombinationHash([1, 2, 3]), generateCombinationHash([1, 2, 4]));
});
