const outfitEngine = require('../services/outfitEngine');

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

module.exports = {
  generate,
  wear: (req, res) => { res.status(501).json({ success: false, data: null, error: 'Not implemented' }); },
  favorite: (req, res) => { res.status(501).json({ success: false, data: null, error: 'Not implemented' }); },
  history: (req, res) => { res.status(501).json({ success: false, data: null, error: 'Not implemented' }); },
};
