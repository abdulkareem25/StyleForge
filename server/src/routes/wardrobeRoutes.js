const router = require('express').Router();
const wardrobeController = require('../controllers/wardrobeController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { wardrobeQuerySchema } = require('../validators/wardrobeValidators');
const rateLimiter = require('../middleware/rateLimiter');

router.use(authMiddleware);

router.get('/colors', wardrobeController.colors);
router.get('/:id', wardrobeController.show);
router.get('/', validateRequest(wardrobeQuerySchema, 'query'), wardrobeController.list);
router.post('/upload-auth', rateLimiter.uploadAuthLimiter, wardrobeController.uploadAuth);
router.post('/', rateLimiter.aiTaggingLimiter, wardrobeController.create);
router.patch('/:id', wardrobeController.update);
router.delete('/:id', wardrobeController.remove);

module.exports = router;
