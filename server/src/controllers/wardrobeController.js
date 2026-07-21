const WardrobeItem = require('../models/WardrobeItem');
const { deleteImage, getUploadSignature } = require('../services/imageService');

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  expires: new Date(0),
};

// ── List wardrobe items with filters and search (CAT-02) ────────────
const list = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      category,
      color,
      formalityTag,
      isActive,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { userId };

    if (category) filter.category = category;
    if (formalityTag) filter.formalityTags = formalityTag;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (color) {
      const regex = new RegExp(color, 'i');
      filter.$or = [
        { primaryColor: regex },
        { secondaryColor: regex },
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

const create = async (req, res) => {
  res.status(501).json({ success: false, data: null, error: 'Not implemented' });
};

const update = async (req, res) => {
  res.status(501).json({ success: false, data: null, error: 'Not implemented' });
};

const remove = async (req, res) => {
  res.status(501).json({ success: false, data: null, error: 'Not implemented' });
};

module.exports = {
  list,
  colors,
  uploadAuth,
  create,
  update,
  remove,
};
