const router = require('express').Router();
const outfitController = require('../controllers/outfitController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { outfitGenerateSchema, outfitHistoryQuerySchema, favoritesQuerySchema } = require('../validators/outfitValidators');

router.use(authMiddleware);

router.post('/generate', validateRequest(outfitGenerateSchema), outfitController.generate);
router.get('/favorites', validateRequest(favoritesQuerySchema, 'query'), outfitController.favorites);
router.get('/history', validateRequest(outfitHistoryQuerySchema, 'query'), outfitController.history);
router.post('/:id/wear', outfitController.wear);
router.post('/:id/favorite', outfitController.favorite);

module.exports = router;
