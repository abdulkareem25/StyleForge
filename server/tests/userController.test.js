const test = require('node:test');
const assert = require('node:assert/strict');

process.env.IMAGEKIT_PUBLIC_KEY = 'test-public-key';
process.env.IMAGEKIT_PRIVATE_KEY = 'test-private-key';
process.env.IMAGEKIT_URL_ENDPOINT = 'https://test.imagekit.io';

const userController = require('../src/controllers/userController');
const User = require('../src/models/User');

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

// ── GET /users/me ────────────────────────────────────────────────────

test('getMe returns the authenticated user profile without passwordHash', async () => {
  const originalFindById = User.findById;

  User.findById = (id) => {
    assert.equal(id, 'user-1');
    return {
      select: (fields) => {
        assert.equal(fields, '-passwordHash');
        return {
          lean: () => ({ exec: async () => ({ _id: 'user-1', name: 'Jane', email: 'jane@test.com' }) }),
          then: (resolve) => resolve({ _id: 'user-1', name: 'Jane', email: 'jane@test.com' }),
        };
      },
    };
  };

  const req = { user: { id: 'user-1' } };
  const res = createResponse();

  await userController.getMe(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(res.payload.data.name, 'Jane');
  assert.equal(res.payload.data.email, 'jane@test.com');

  User.findById = originalFindById;
});

test('getMe returns 404 when user is not found', async () => {
  const originalFindById = User.findById;

  User.findById = () => ({
    select: () => ({
      lean: () => ({ exec: async () => null }),
      then: (resolve) => resolve(null),
    }),
  });

  const req = { user: { id: 'nonexistent' } };
  const res = createResponse();

  await userController.getMe(req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.success, false);
  assert.equal(res.payload.error, 'User not found');

  User.findById = originalFindById;
});

test('getMe is scoped to the authenticated user only', async () => {
  const originalFindById = User.findById;
  let queriedId = null;

  User.findById = (id) => {
    queriedId = id;
    return {
      select: () => ({
        then: (resolve) => resolve({ _id: id, name: 'Test' }),
      }),
    };
  };

  const req = { user: { id: 'user-42' } };
  const res = createResponse();

  await userController.getMe(req, res, () => {});

  assert.equal(queriedId, 'user-42');
  assert.equal(res.statusCode, 200);

  User.findById = originalFindById;
});

// ── PATCH /users/me/preferences ──────────────────────────────────────

test('updatePreferences updates stylePreferences with field whitelisting', async () => {
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  let updatePayload = null;

  User.findByIdAndUpdate = (id, update, options) => {
    assert.equal(id, 'user-1');
    assert.deepEqual(options, { new: true, runValidators: true });
    updatePayload = update;
    return {
      select: (fields) => {
        assert.equal(fields, '-passwordHash');
        return {
          then: (resolve) => resolve({
            _id: 'user-1',
            stylePreferences: {
              preferredColors: ['blue', 'red'],
              fitPreference: 'slim',
              printTolerance: 'low',
            },
          }),
        };
      },
    };
  };

  const req = {
    user: { id: 'user-1' },
    body: { preferredColors: ['blue', 'red'], fitPreference: 'slim', printTolerance: 'low' },
  };
  const res = createResponse();

  await userController.updatePreferences(req, res, () => {});

  assert.deepEqual(updatePayload, {
    $set: {
      'stylePreferences.preferredColors': ['blue', 'red'],
      'stylePreferences.fitPreference': 'slim',
      'stylePreferences.printTolerance': 'low',
    },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);

  User.findByIdAndUpdate = originalFindByIdAndUpdate;
});

test('updatePreferences ignores fields not in the whitelist', async () => {
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  let updatePayload = null;

  User.findByIdAndUpdate = (id, update, options) => {
    updatePayload = update;
    return {
      select: () => ({
        then: (resolve) => resolve({ _id: 'user-1', stylePreferences: { fitPreference: 'oversized' } }),
      }),
    };
  };

  const req = {
    user: { id: 'user-1' },
    body: { fitPreference: 'oversized', name: 'Hacker', email: 'evil@test.com', role: 'admin' },
  };
  const res = createResponse();

  await userController.updatePreferences(req, res, () => {});

  // Only fitPreference should be in the update, not name/email/role
  assert.deepEqual(updatePayload, {
    $set: { 'stylePreferences.fitPreference': 'oversized' },
  });
  assert.equal(res.statusCode, 200);

  User.findByIdAndUpdate = originalFindByIdAndUpdate;
});

test('updatePreferences returns 404 when user is not found', async () => {
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;

  User.findByIdAndUpdate = () => ({
    select: () => ({
      then: (resolve) => resolve(null),
    }),
  });

  const req = {
    user: { id: 'nonexistent' },
    body: { fitPreference: 'slim' },
  };
  const res = createResponse();

  await userController.updatePreferences(req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.success, false);

  User.findByIdAndUpdate = originalFindByIdAndUpdate;
});

test('updatePreferences is scoped to the authenticated user only', async () => {
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  let queriedId = null;

  User.findByIdAndUpdate = (id) => {
    queriedId = id;
    return {
      select: () => ({
        then: (resolve) => resolve({ _id: id, stylePreferences: {} }),
      }),
    };
  };

  const req = {
    user: { id: 'user-99' },
    body: { printTolerance: 'high' },
  };
  const res = createResponse();

  await userController.updatePreferences(req, res, () => {});

  assert.equal(queriedId, 'user-99');
  assert.equal(res.statusCode, 200);

  User.findByIdAndUpdate = originalFindByIdAndUpdate;
});

test('updatePreferences handles partial updates (only provided fields)', async () => {
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  let updatePayload = null;

  User.findByIdAndUpdate = (id, update) => {
    updatePayload = update;
    return {
      select: () => ({
        then: (resolve) => resolve({ _id: 'user-1', stylePreferences: { preferredColors: ['green'] } }),
      }),
    };
  };

  const req = {
    user: { id: 'user-1' },
    body: { preferredColors: ['green'] },
  };
  const res = createResponse();

  await userController.updatePreferences(req, res, () => {});

  assert.deepEqual(updatePayload, {
    $set: { 'stylePreferences.preferredColors': ['green'] },
  });
  assert.equal(res.statusCode, 200);

  User.findByIdAndUpdate = originalFindByIdAndUpdate;
});
