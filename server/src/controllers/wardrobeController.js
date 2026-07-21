const WardrobeItem = require('../models/WardrobeItem');
const { getUploadSignature } = require('../services/imageService');
const { tagImage } = require('../services/aiTaggingService');
const { buildUserScopedFilter } = require('../utils/ownership');

// ── List wardrobe items with filters and search (CAT-02) ────────────
const list = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      category,
      color,
      formalityTag,
      occasion,
      isActive,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { userId };

    if (category) filter.category = category;
    const tagFilter = formalityTag || occasion;
    if (tagFilter) filter.formalityTags = tagFilter;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const colorRegex = color ? new RegExp(color, 'i') : null;
    if (colorRegex) {
      filter.$or = [
        { primaryColor: colorRegex },
        { secondaryColor: colorRegex },
      ];
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      const searchFilter = {
        $or: [
          { subCategory: regex },
          { primaryColor: regex },
          { secondaryColor: regex },
        ],
      };
      if (filter.$or) {
        filter.$and = [searchFilter, { $or: filter.$or }];
        delete filter.$or;
      } else {
        Object.assign(filter, searchFilter);
      }
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      WardrobeItem.find(filter)
        .select('id imageUrl thumbnailUrl category subCategory sleeveLength fit primaryColor secondaryColor pattern formalityTags seasonTags isActive userCorrected aiTagConfidence createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WardrobeItem.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// ── Get distinct colors from user's wardrobe (for filter chips) ─────
const colors = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [primary, secondary] = await Promise.all([
      WardrobeItem.distinct('primaryColor', { userId }),
      WardrobeItem.distinct('secondaryColor', { userId, secondaryColor: { $ne: null } }),
    ]);
    const allColors = [...new Set([...primary, ...secondary])].sort();
    res.status(200).json({ success: true, data: allColors, error: null });
  } catch (error) {
    next(error);
  }
};

// ── WARD-01: ImageKit signed upload-auth token ───────────────────────
// Returns a short-lived signed token so the client can upload directly
// to ImageKit — image bytes never pass through the Express server (TAD §3, §11).
//
// Upload security is enforced at this boundary:
//   - Allowed types: JPEG, PNG, WebP only (no SVG — scripts; no HEIC — unsupported)
//   - Size cap: 10MB (enforced client-side pre-upload + ImageKit server-side)
//   - Magic-byte validation: runs client-side before upload (fileValidation.js)
//   - EXIF/GPS stripping: handled via ImageKit transformation pipeline or
//     client-side canvas re-encoding before upload (Security doc §5)
//
// The actual file never touches this server. This endpoint only hands out
// the signed auth parameters; validation of the uploaded content is the
// client's responsibility before upload, and ImageKit's on storage.
const uploadAuth = async (req, res, next) => {
  try {
    const authParams = getUploadSignature({ expiresInSeconds: 1800 });

    res.status(200).json({
      success: true,
      data: authParams,
      error: null,
    });
  } catch (error) {
    console.error('Failed to generate upload auth token:', error.message || error);
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const allowedFields = [
      'imageUrl',
      'thumbnailUrl',
      'category',
      'subCategory',
      'sleeveLength',
      'fit',
      'primaryColor',
      'secondaryColor',
      'pattern',
      'formalityTags',
      'seasonTags',
    ];

    const payload = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    });

    if (!payload.imageUrl) {
      return res.status(400).json({ success: false, data: null, error: 'imageUrl is required' });
    }

    const taggingResult = await tagImage(payload.imageUrl);
    const item = await WardrobeItem.create({
      userId,
      imageUrl: payload.imageUrl,
      thumbnailUrl: payload.thumbnailUrl || payload.imageUrl,
      category: payload.category || taggingResult.category,
      subCategory: payload.subCategory || taggingResult.subCategory,
      sleeveLength: payload.sleeveLength || taggingResult.sleeveLength,
      fit: payload.fit || taggingResult.fit,
      primaryColor: payload.primaryColor || taggingResult.primaryColor,
      secondaryColor: payload.secondaryColor ?? taggingResult.secondaryColor ?? null,
      pattern: payload.pattern || taggingResult.pattern,
      formalityTags: Array.isArray(payload.formalityTags) ? payload.formalityTags : (taggingResult.formalityTags || []),
      seasonTags: Array.isArray(payload.seasonTags) ? payload.seasonTags : (taggingResult.seasonTags || []),
      isActive: false,
      userCorrected: false,
      aiTagConfidence: taggingResult.aiTagConfidence ?? 0,
    });

    res.status(201).json({
      success: true,
      data: {
        item: {
          id: item._id,
          imageUrl: item.imageUrl,
          thumbnailUrl: item.thumbnailUrl,
          category: item.category,
          subCategory: item.subCategory,
          sleeveLength: item.sleeveLength,
          fit: item.fit,
          primaryColor: item.primaryColor,
          secondaryColor: item.secondaryColor,
          pattern: item.pattern,
          formalityTags: item.formalityTags,
          seasonTags: item.seasonTags,
          aiTagConfidence: item.aiTagConfidence,
          createdAt: item.createdAt,
        },
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const allowedFields = [
      'category',
      'subCategory',
      'sleeveLength',
      'fit',
      'primaryColor',
      'secondaryColor',
      'pattern',
      'formalityTags',
      'seasonTags',
      'isActive',
      'userCorrected',
    ];

    const payload = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    });

    const correctionFields = ['category', 'subCategory', 'sleeveLength', 'fit', 'primaryColor', 'secondaryColor', 'pattern', 'formalityTags', 'seasonTags'];
    const hasCorrection = correctionFields.some((field) => Object.prototype.hasOwnProperty.call(payload, field));

    if (hasCorrection) {
      payload.userCorrected = true;
      payload.isActive = true;
    }

    const filter = buildUserScopedFilter(itemId, userId);
    const existingItem = await WardrobeItem.findOne(filter);
    if (!existingItem) {
      return res.status(404).json({ success: false, data: null, error: 'Wardrobe item not found' });
    }

    const item = await WardrobeItem.findOneAndUpdate(
      filter,
      { $set: payload },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      data: {
        item: {
          id: item._id,
          imageUrl: item.imageUrl,
          thumbnailUrl: item.thumbnailUrl,
          category: item.category,
          subCategory: item.subCategory,
          sleeveLength: item.sleeveLength,
          fit: item.fit,
          primaryColor: item.primaryColor,
          secondaryColor: item.secondaryColor,
          pattern: item.pattern,
          formalityTags: item.formalityTags,
          seasonTags: item.seasonTags,
          isActive: item.isActive,
          userCorrected: item.userCorrected,
          aiTagConfidence: item.aiTagConfidence,
          createdAt: item.createdAt,
        },
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const filter = buildUserScopedFilter(itemId, userId);

    const item = await WardrobeItem.findOneAndUpdate(
      filter,
      { $set: { isActive: false } },
      { new: true, runValidators: true },
    );

    if (!item) {
      return res.status(404).json({ success: false, data: null, error: 'Wardrobe item not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        item: {
          id: item._id,
          isActive: item.isActive,
        },
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  colors,
  uploadAuth,
  create,
  update,
  remove,
};
