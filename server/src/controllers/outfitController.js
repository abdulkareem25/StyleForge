const outfitEngine = require('../services/outfitEngine');
const Outfit = require('../models/Outfit');
const OutfitHistory = require('../models/OutfitHistory');
const { generateCombinationHash } = require('../utils/comboHash');

const generate = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    const { occasion, weather } = req.body || {};

    const result = await outfitEngine.generateOutfits(userId, { occasion, weather });

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

module.exports = {
  generate,
  wear,
  favorite: (req, res) => { res.status(501).json({ success: false, data: null, error: 'Not implemented' }); },
  history: (req, res) => { res.status(501).json({ success: false, data: null, error: 'Not implemented' }); },
};
