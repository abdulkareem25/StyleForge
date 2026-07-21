const test = require('node:test');
const assert = require('node:assert/strict');

const outfitController = require('../src/controllers/outfitController');
const Outfit = require('../src/models/Outfit');
const { OutfitGenerationError } = require('../src/errors/AppError');

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

test('toggles isFavorite from false to true', async () => {
  const originalFindOne = Outfit.findOne;
  const originalFindOneAndUpdate = Outfit.findOneAndUpdate;

  Outfit.findOne = async (filter) => {
    assert.equal(filter._id, 'outfit-1');
    assert.equal(filter.userId, 'user-1');
    return { _id: 'outfit-1', userId: 'user-1', isFavorite: false };
  };
  Outfit.findOneAndUpdate = async () => ({ _id: 'outfit-1', isFavorite: true });

  const req = { user: { id: 'user-1' }, params: { id: 'outfit-1' } };
  const res = createResponse();

  await outfitController.favorite(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(res.payload.data.isFavorite, true);

  Outfit.findOne = originalFindOne;
  Outfit.findOneAndUpdate = originalFindOneAndUpdate;
});

test('toggles isFavorite from true to false', async () => {
  const originalFindOne = Outfit.findOne;
  const originalFindOneAndUpdate = Outfit.findOneAndUpdate;

  Outfit.findOne = async (filter) => {
    assert.equal(filter._id, 'outfit-1');
    assert.equal(filter.userId, 'user-1');
    return { _id: 'outfit-1', userId: 'user-1', isFavorite: true };
  };
  Outfit.findOneAndUpdate = async () => ({ _id: 'outfit-1', isFavorite: false });

  const req = { user: { id: 'user-1' }, params: { id: 'outfit-1' } };
  const res = createResponse();

  await outfitController.favorite(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(res.payload.data.isFavorite, false);

  Outfit.findOne = originalFindOne;
  Outfit.findOneAndUpdate = originalFindOneAndUpdate;
});

test('returns 404 when outfit does not exist for user', async () => {
  const originalFindOne = Outfit.findOne;
  Outfit.findOne = async () => null;

  const req = { user: { id: 'user-1' }, params: { id: 'nonexistent' } };
  const res = createResponse();

  await outfitController.favorite(req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.success, false);
  assert.equal(res.payload.error, 'Outfit not found');

  Outfit.findOne = originalFindOne;
});

test('returns 404 when outfit belongs to another user', async () => {
  const originalFindOne = Outfit.findOne;
  Outfit.findOne = async (filter) => {
    assert.equal(filter.userId, 'user-2');
    return null;
  };

  const req = { user: { id: 'user-2' }, params: { id: 'outfit-1' } };
  const res = createResponse();

  await outfitController.favorite(req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.success, false);

  Outfit.findOne = originalFindOne;
});

test('is idempotent — two calls produce correctly toggled states', async () => {
  const originalFindOne = Outfit.findOne;
  const originalFindOneAndUpdate = Outfit.findOneAndUpdate;

  let currentState = false;
  Outfit.findOne = async () => {
    return { _id: 'outfit-1', userId: 'user-1', isFavorite: currentState };
  };
  Outfit.findOneAndUpdate = async () => {
    currentState = !currentState;
    return { _id: 'outfit-1', isFavorite: currentState };
  };

  const req = { user: { id: 'user-1' }, params: { id: 'outfit-1' } };

  const res1 = createResponse();
  await outfitController.favorite(req, res1, () => {});
  assert.equal(res1.payload.data.isFavorite, true);

  const res2 = createResponse();
  await outfitController.favorite(req, res2, () => {});
  assert.equal(res2.payload.data.isFavorite, false);

  Outfit.findOne = originalFindOne;
  Outfit.findOneAndUpdate = originalFindOneAndUpdate;
});

test('calls next with OutfitGenerationError on unexpected errors', async () => {
  const originalFindOne = Outfit.findOne;
  Outfit.findOne = async () => {
    throw new Error('db connection lost');
  };

  const req = { user: { id: 'user-1' }, params: { id: 'outfit-1' } };
  const res = createResponse();
  let nextError = null;

  await outfitController.favorite(req, res, (err) => { nextError = err; });

  assert.ok(nextError instanceof OutfitGenerationError);
  assert.equal(nextError.status, 500);
  assert.equal(nextError.category, 'outfit');
  assert.equal(nextError.alert, true);
  assert.equal(nextError.message, 'Something went wrong toggling favorite');

  Outfit.findOne = originalFindOne;
});
