const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { tagImage } = require(path.join(__dirname, '..', 'src', 'services', 'aiTaggingService'));

test('returns a manual-tagging fallback when the Gemini API request fails', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  global.fetch = async (url) => {
    if (url.includes('generativelanguage')) {
      throw new Error('network down');
    }

    return {
      ok: true,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: async () => Buffer.from('fake-image'),
    };
  };

  const result = await tagImage('https://example.com/photo.jpg');

  assert.equal(result.manualReviewRequired, true);
  assert.equal(result.manualTagMessage, "We couldn't auto-tag this — add the details yourself");
  assert.equal(result.aiTagConfidence, 0);
  assert.equal(result.category, 'top');
});

test('normalizes a valid Gemini response into the wardrobe shape', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  global.fetch = async (url) => {
    if (url.includes('generativelanguage')) {
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      category: 'top',
                      subCategory: 'shirt',
                      primaryColor: 'blue',
                      secondaryColor: 'white',
                      pattern: 'solid',
                      sleeveLength: 'full',
                      fit: 'regular',
                      formalityTags: ['casual', 'office'],
                      seasonTags: ['all-season'],
                      confidence: 0.82,
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
    }

    return {
      ok: true,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: async () => Buffer.from('fake-image'),
    };
  };

  const result = await tagImage('https://example.com/photo.jpg');

  assert.equal(result.category, 'top');
  assert.equal(result.subCategory, 'shirt');
  assert.equal(result.primaryColor, 'blue');
  assert.equal(result.secondaryColor, 'white');
  assert.equal(result.pattern, 'solid');
  assert.equal(result.sleeveLength, 'full');
  assert.equal(result.fit, 'regular');
  assert.deepEqual(result.formalityTags, ['casual', 'office']);
  assert.deepEqual(result.seasonTags, ['all-season']);
  assert.equal(result.aiTagConfidence, 0.82);
  assert.equal(result.manualReviewRequired, false);
});
