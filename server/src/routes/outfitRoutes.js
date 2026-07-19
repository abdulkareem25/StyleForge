const router = require('express').Router();
const outfitController = require('../controllers/outfitController');

router.post('/generate', outfitController.generate);
router.post('/:id/wear', outfitController.wear);
router.post('/:id/favorite', outfitController.favorite);
router.get('/history', outfitController.history);

module.exports = router;
