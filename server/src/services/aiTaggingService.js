const User = require('../models/User');
const {
  categories,
  subCategories,
  sleeveLengths,
  fits,
  patterns,
  formalityTags,
  seasonTags,
} = require('../constants/categories');
const geminiConfig = require('../config/gemini');

const DEFAULT_MODEL_ID = 'gemini-2.5-flash';
const DEFAULT_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 12000;
const LOW_CONFIDENCE_THRESHOLD = 0.6;
const MANUAL_TAG_MESSAGE = "We couldn't auto-tag this — add the details yourself";
const MODEL_ID = process.env.GEMINI_MODEL || DEFAULT_MODEL_ID;

const buildManualReviewResult = (message = MANUAL_TAG_MESSAGE) => ({
  category: categories[0],
  subCategory: subCategories[categories[0]][0] || 'shirt',
  sleeveLength: 'n/a',
  fit: 'regular',
  primaryColor: 'unknown',
  secondaryColor: null,
  pattern: 'solid',
  formalityTags: [],
  seasonTags: [],
  aiTagConfidence: 0,
  manualReviewRequired: true,
  manualTagMessage: message,
});

const buildPrompt = () => {
  const subcategoryList = Object.entries(subCategories)
    .map(([category, items]) => `${category}: ${items.join(', ')}`)
    .join(' | ');

  return [
    'You are classifying a wardrobe photo for a fashion assistant.',
    'Return valid JSON only and do not include markdown fences.',
    'Use the taxonomy below exactly and only use values from the allowed lists.',
    `Categories: ${categories.join(', ')}`,
    `Subcategories: ${subcategoryList}`,
    `Sleeve lengths: ${sleeveLengths.join(', ')}`,
    `Fits: ${fits.join(', ')}`,
    `Patterns: ${patterns.join(', ')}`,
    `Formality tags: ${formalityTags.join(', ')}`,
    `Season tags: ${seasonTags.join(', ')}`,
    'Return a JSON object with these fields: category, subCategory, primaryColor, secondaryColor, pattern, sleeveLength, fit, formalityTags, seasonTags, confidence.',
    'Set confidence to a number from 0 to 1.',
  ].join('\n');
};

const normalizeChoice = (value, allowedValues, fallback) => {
  const candidate = String(value || '').trim().toLowerCase();
  if (!candidate) return fallback;
  return allowedValues.includes(candidate) ? candidate : fallback;
};

const normalizeColor = (value) => {
  const candidate = String(value || '').trim().toLowerCase();
  return candidate || 'unknown';
};

const normalizeTagList = (value, allowedValues) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim().toLowerCase())
    .filter((item) => item && allowedValues.includes(item));
};

const extractJson = (text) => {
  if (!text) return null;

  const trimmed = String(text).trim();
  const matches = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = matches ? matches[1] : trimmed;

  try {
    return JSON.parse(candidate);
  } catch (_error) {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
      } catch (_parseError) {
        return null;
      }
    }
    return null;
  }
};

const normalizeTaggingResponse = (response) => {
  const category = normalizeChoice(response.category, categories, categories[0]);
  const categorySpecificSubCategories = subCategories[category] || subCategories[categories[0]];
  const subCategory = normalizeChoice(
    response.subCategory,
    categorySpecificSubCategories,
    categorySpecificSubCategories[0] || 'shirt',
  );

  return {
    category,
    subCategory,
    sleeveLength: normalizeChoice(response.sleeveLength, sleeveLengths, 'n/a'),
    fit: normalizeChoice(response.fit, fits, 'regular'),
    primaryColor: normalizeColor(response.primaryColor),
    secondaryColor: response.secondaryColor ? normalizeColor(response.secondaryColor) : null,
    pattern: normalizeChoice(response.pattern, patterns, 'solid'),
    formalityTags: normalizeTagList(response.formalityTags, formalityTags),
    seasonTags: normalizeTagList(response.seasonTags, seasonTags),
    aiTagConfidence: Math.max(0, Math.min(1, Number(response.confidence ?? response.aiTagConfidence ?? 0))),
  };
};

const parseGeminiResponse = (payload) => {
  const text = payload?.candidates?.[0]?.content?.parts?.find((part) => typeof part?.text === 'string')?.text;
  if (!text) return null;
  return extractJson(text);
};

/**
 * Processes AI tagging results for a wardrobe item.
 * Includes a guard to discard results for soft-deleted users (AUTH-05, Security doc §8).
 * @param {string} userId
 * @param {string} itemId
 * @param {object} taggingResult - AI-generated tags
 * @returns {Promise<object|null>} Updated item or null if user was deleted
 */
const applyTaggingResult = async (userId, itemId, taggingResult) => {
  // Guard: discard results for deleted users (AUTH-05)
  const user = await User.findById(userId).setOptions({ withDeleted: true });
  if (!user || user.deletedAt) {
    console.warn(`Discarding AI tagging result for deleted user ${userId}, item ${itemId}`);
    return null;
  }

  return taggingResult;
};

const tagImage = async (imageUrl) => {
  if (!imageUrl) {
    return buildManualReviewResult('No image URL provided');
  }

  const apiKey = process.env.GEMINI_API_KEY || geminiConfig.apiKey;
  if (!apiKey) {
    return buildManualReviewResult('Gemini API key is not configured');
  }

  try {
    const imageResponse = await globalThis.fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Unable to download image (${imageResponse.status})`);
    }

    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const controller = globalThis.AbortController ? new globalThis.AbortController() : undefined;
    const timeout = controller ? setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS) : null;

    const response = await globalThis.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: buildPrompt() },
                {
                  inlineData: {
                    mimeType,
                    data: imageBuffer.toString('base64'),
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
        signal: controller ? controller.signal : undefined,
      },
    );

    if (timeout) clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Gemini API responded with ${response.status}`);
    }

    const payload = await response.json();
    const parsedResponse = parseGeminiResponse(payload);
    if (!parsedResponse) {
      throw new Error('Gemini returned an invalid response');
    }

    const normalized = normalizeTaggingResponse(parsedResponse);
    const manualReviewRequired = normalized.aiTagConfidence < LOW_CONFIDENCE_THRESHOLD;

    return {
      ...normalized,
      manualReviewRequired,
      manualTagMessage: manualReviewRequired ? 'Low-confidence tags need review' : null,
    };
  } catch (error) {
    console.error('Gemini image tagging failed:', error.message || error);
    return buildManualReviewResult();
  }
};

module.exports = {
  tagImage,
  applyTaggingResult,
};
