process.env.IMAGEKIT_PUBLIC_KEY = 'test-public-key';
process.env.IMAGEKIT_PRIVATE_KEY = 'test-private-key';
process.env.IMAGEKIT_URL_ENDPOINT = 'https://example.com';

const test = require('node:test');
const assert = require('node:assert/strict');

const aiTaggingService = require('../src/services/aiTaggingService');
const WardrobeItem = require('../src/models/WardrobeItem');

const originalTagImage = aiTaggingService.tagImage;

function createMockRes() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test('create whitelists client-editable fields and keeps server-controlled values private', async () => {
  let createdPayload;
  const createdItem = {
    _id: 'item-123',
    imageUrl: 'https://example.com/item.jpg',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    category: 'tops',
    subCategory: 't-shirt',
    sleeveLength: 'short',
    fit: 'regular',
    primaryColor: 'blue',
    secondaryColor: 'white',
    pattern: 'solid',
    formalityTags: ['casual'],
    seasonTags: ['summer'],
    aiTagConfidence: 0.87,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  aiTaggingService.tagImage = async () => ({
    category: 'tops',
    subCategory: 't-shirt',
    sleeveLength: 'short',
    fit: 'regular',
    primaryColor: 'blue',
    secondaryColor: 'white',
    pattern: 'solid',
    formalityTags: ['casual'],
    seasonTags: ['summer'],
    aiTagConfidence: 0.87,
    manualReviewRequired: false,
    manualTagMessage: null,
  });

  WardrobeItem.create = async (payload) => {
    createdPayload = payload;
    return createdItem;
  };

  delete require.cache[require.resolve('../src/controllers/wardrobeController')];
  const wardrobeController = require('../src/controllers/wardrobeController');

  const req = {
    user: { id: 'user-123' },
    body: {
      userId: 'attacker-user',
      isActive: false,
      aiTagConfidence: 0.99,
      imageUrl: 'https://example.com/item.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      category: 'tops',
      subCategory: 't-shirt',
      sleeveLength: 'short',
      fit: 'regular',
      primaryColor: 'blue',
      secondaryColor: 'white',
      pattern: 'solid',
      formalityTags: ['casual'],
      seasonTags: ['summer'],
      extraField: 'should-not-be-written',
    },
  };
  const res = createMockRes();
  const next = () => { };

  await wardrobeController.create(req, res, next);

  assert.equal(createdPayload.userId, 'user-123');
  assert.equal(createdPayload.isActive, true);
  assert.equal(createdPayload.userCorrected, false);
  assert.equal(createdPayload.aiTagConfidence, 0.87);
  assert.equal(createdPayload.extraField, undefined);
  assert.deepEqual(res.payload.data.item, {
    id: 'item-123',
    imageUrl: 'https://example.com/item.jpg',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    category: 'tops',
    subCategory: 't-shirt',
    sleeveLength: 'short',
    fit: 'regular',
    primaryColor: 'blue',
    secondaryColor: 'white',
    pattern: 'solid',
    formalityTags: ['casual'],
    seasonTags: ['summer'],
    aiTagConfidence: 0.87,
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  assert.equal(res.payload.data.manualReviewRequired, undefined);
  assert.equal(res.payload.data.manualTagMessage, undefined);

  aiTaggingService.tagImage = originalTagImage;
  WardrobeItem.create = originalWardrobeCreate;
});

const originalWardrobeCreate = WardrobeItem.create;
