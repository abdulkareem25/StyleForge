const outfitEngine = require('../services/outfitEngine');
const Outfit = require('../models/Outfit');
const OutfitHistory = require('../models/OutfitHistory');
const { generateCombinationHash } = require('../utils/comboHash');
const { buildUserScopedFilter } = require('../utils/ownership');

const generate = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    const { occasion, weather, overrideRepeat, swapItemIds, swapCategory } = req.body || {};

    const result = await outfitEngine.generateOutfits(userId, { occasion, weather, overrideRepeat, swapItemIds, swapCategory });

    return res.status(200).json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error) {
    console.error(error.stack || error.message || error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'Something went wrong generating your outfit — please try again',
    });
  }
};

const wear = async (req, res, _next) => {
  try {
    const userId = req.user && req.user.id;
    const { itemIds = [], occasion, weather } = req.body || {};

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, data: null, error: 'itemIds are required' });
    }

    const combinationHash = generateCombinationHash(itemIds);

    const existingOutfit = await Outfit.findOne({ userId, combinationHash });

    let outfit;
    if (existingOutfit) {
      outfit = existingOutfit;
    } else {
      try {
        outfit = await Outfit.create({ userId, itemIds, combinationHash });
      } catch (error) {
        if (error && error.code === 11000) {
          outfit = await Outfit.findOne({ userId, combinationHash });
        } else {
          throw error;
        }
      }
    }

    const recentHistoryWindow = new Date(Date.now() - 5000);
    const recentHistoryQuery = OutfitHistory.findOne({
      userId,
      outfitId: outfit._id,
      occasionTag: occasion,
      weatherContext: weather,
      wornDate: { $gte: recentHistoryWindow },
    });

    const recentHistory = recentHistoryQuery && typeof recentHistoryQuery.lean === 'function'
      ? await recentHistoryQuery.lean().exec()
      : await recentHistoryQuery;

    if (recentHistory) {
      return res.status(200).json({ success: true, data: { outfitId: outfit._id, alreadyRecorded: true }, error: null });
    }

    await OutfitHistory.create({
      userId,
      outfitId: outfit._id,
      occasionTag: occasion,
      weatherContext: weather,
      wornDate: new Date(),
    });

    return res.status(200).json({ success: true, data: { outfitId: outfit._id, alreadyRecorded: false }, error: null });
  } catch (error) {
    console.error(error.stack || error.message || error);
    return res.status(500).json({ success: false, data: null, error: 'Something went wrong confirming your wear' });
  }
};

const favorite = async (req, res, _next) => {
  try {
    const userId = req.user && req.user.id;
    const { id } = req.params;

    const filter = buildUserScopedFilter(id, userId);
    const outfit = await Outfit.findOne(filter);

    if (!outfit) {
      return res.status(404).json({ success: false, data: null, error: 'Outfit not found' });
    }

    const updated = await Outfit.findOneAndUpdate(
      filter,
      [{ $set: { isFavorite: { $not: '$isFavorite' } } }],
      { new: true },
    );

    return res.status(200).json({
      success: true,
      data: { isFavorite: updated.isFavorite },
      error: null,
    });
  } catch (error) {
    console.error(error.stack || error.message || error);
    return res.status(500).json({ success: false, data: null, error: 'Something went wrong toggling favorite' });
  }
};

module.exports = {
  generate,
  wear,
  favorite,
  history: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, occasion } = req.query;

      const filter = { userId };
      if (occasion) filter.occasionTag = occasion;

      const skip = (page - 1) * limit;

      const [entries, total] = await Promise.all([
        OutfitHistory.find(filter)
          .sort({ wornDate: -1 })
          .skip(skip)
          .limit(limit)
          .populate({
            path: 'outfitId',
            select: 'itemIds',
            populate: { path: 'itemIds', select: 'category subCategory primaryColor secondaryColor imageUrl thumbnailUrl' },
          })
          .lean(),
        OutfitHistory.countDocuments(filter),
      ]);

      const history = entries.map((entry) => ({
        id: entry._id,
        wornDate: entry.wornDate,
        occasionTag: entry.occasionTag,
        weatherContext: entry.weatherContext,
        outfit: entry.outfitId
          ? {
              id: entry.outfitId._id,
              items: (entry.outfitId.itemIds || []).map((item) => ({
                id: item._id,
                category: item.category,
                subCategory: item.subCategory,
                primaryColor: item.primaryColor,
                secondaryColor: item.secondaryColor,
                imageUrl: item.imageUrl,
                thumbnailUrl: item.thumbnailUrl,
              })),
            }
          : null,
      }));

      return res.status(200).json({
        success: true,
        data: {
          history,
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
  },
};
