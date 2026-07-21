const router = require('express').Router();
const outfitController = require('../controllers/outfitController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { outfitGenerateSchema } = require('../validators/outfitValidators');

router.use(authMiddleware);

router.post('/generate', validateRequest(outfitGenerateSchema), outfitController.generate);
router.post('/:id/wear', outfitController.wear);
router.post('/:id/favorite', outfitController.favorite);
router.get('/history', outfitController.history);

module.exports = router;
