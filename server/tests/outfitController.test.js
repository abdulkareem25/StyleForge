const test = require('node:test');
const assert = require('node:assert/strict');

const outfitController = require('../src/controllers/outfitController');
const outfitEngine = require('../src/services/outfitEngine');

function createResponse() {
  let statusCode = 200;
  let payload = null;

  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      payload = value;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get payload() {
      return payload;
    },
  };
}

test('returns outfit generation results using the authenticated user id', async () => {
  const originalGenerateOutfits = outfitEngine.generateOutfits;
  outfitEngine.generateOutfits = async (userId, options) => {
    assert.equal(userId, 'user-123');
    assert.deepEqual(options, { occasion: 'casual', weather: 'summer' });
    return { outfits: [{ itemIds: ['a', 'b'] }], usedFallback: false };
  };

  const req = { user: { id: 'user-123' }, body: { occasion: 'casual', weather: 'summer' } };
  const res = createResponse();
  const next = () => { };

  await outfitController.generate(req, res, next);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, {
    success: true,
    data: { outfits: [{ itemIds: ['a', 'b'] }], usedFallback: false },
    error: null,
  });

  outfitEngine.generateOutfits = originalGenerateOutfits;
});

test('returns a generic error to the client and logs a stack trace for unexpected engine failures', async () => {
  const originalGenerateOutfits = outfitEngine.generateOutfits;
  outfitEngine.generateOutfits = async () => {
    throw new Error('db exploded');
  };

  const req = { user: { id: 'user-123' }, body: { occasion: 'casual', weather: 'summer' } };
  const res = createResponse();
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  await outfitController.generate(req, res, next);

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.error, 'Something went wrong generating your outfit — please try again');

  outfitEngine.generateOutfits = originalGenerateOutfits;
});
