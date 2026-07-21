const test = require('node:test');
const assert = require('node:assert/strict');

const outfitController = require('../src/controllers/outfitController');
const Outfit = require('../src/models/Outfit');
const OutfitHistory = require('../src/models/OutfitHistory');

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

test('creates an outfit and writes a single history entry on first wear confirmation', async () => {
  const originalFindOne = Outfit.findOne;
  const originalCreate = Outfit.create;
  const originalCreateHistory = OutfitHistory.create;
  const originalFindHistory = OutfitHistory.findOne;

  let createCalls = 0;
  let historyCalls = 0;

  Outfit.findOne = async () => null;
  Outfit.create = async (doc) => {
    createCalls += 1;
    return { _id: 'outfit-1', ...doc };
  };
  OutfitHistory.findOne = async () => null;
  OutfitHistory.create = async (doc) => {
    historyCalls += 1;
    return { _id: 'history-1', ...doc };
  };

  const req = {
    user: { id: 'user-1' },
    params: { id: 'ignored' },
    body: { occasion: 'casual', weather: 'summer', itemIds: ['shirt-1', 'pants-1', 'shoes-1'] },
  };
  const res = createResponse();

  await outfitController.wear(req, res, () => { });

  assert.equal(createCalls, 1);
  assert.equal(historyCalls, 1);
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);

  Outfit.findOne = originalFindOne;
  Outfit.create = originalCreate;
  OutfitHistory.findOne = originalFindHistory;
  OutfitHistory.create = originalCreateHistory;
});

test('succeeds silently on duplicate wear confirmation retries', async () => {
  const originalFindOne = Outfit.findOne;
  const originalCreate = Outfit.create;
  const originalCreateHistory = OutfitHistory.create;
  const originalFindHistory = OutfitHistory.findOne;

  let createCalls = 0;
  let historyCalls = 0;
  let findOneCalls = 0;

  Outfit.findOne = async () => {
    findOneCalls += 1;
    return findOneCalls === 1 ? null : { _id: 'outfit-1', combinationHash: 'hash-1' };
  };
  Outfit.create = async () => {
    createCalls += 1;
    return { _id: 'outfit-2' };
  };
  OutfitHistory.findOne = async () => {
    return historyCalls === 0 ? null : { _id: 'history-2' };
  };
  OutfitHistory.create = async () => {
    historyCalls += 1;
    return { _id: 'history-2' };
  };

  const req = {
    user: { id: 'user-1' },
    params: { id: 'ignored' },
    body: { occasion: 'casual', weather: 'summer', itemIds: ['shirt-1', 'pants-1', 'shoes-1'] },
  };
  const res = createResponse();

  await outfitController.wear(req, res, () => { });
  await outfitController.wear(req, res, () => { });

  assert.equal(createCalls, 1);
  assert.equal(historyCalls, 1);
  assert.equal(res.statusCode, 200);

  Outfit.findOne = originalFindOne;
  Outfit.create = originalCreate;
  OutfitHistory.findOne = originalFindHistory;
  OutfitHistory.create = originalCreateHistory;
});
