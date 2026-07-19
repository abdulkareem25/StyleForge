const router = require('express').Router();
const outfitController = require('../controllers/outfitController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/generate', outfitController.generate);
router.post('/:id/wear', outfitController.wear);
router.post('/:id/favorite', outfitController.favorite);
router.get('/history', outfitController.history);

module.exports = router;
