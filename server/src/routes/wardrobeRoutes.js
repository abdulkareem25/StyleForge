const router = require('express').Router();
const wardrobeController = require('../controllers/wardrobeController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { wardrobeQuerySchema } = require('../validators/wardrobeValidators');

router.use(authMiddleware);

router.get('/colors', wardrobeController.colors);
router.get('/', validateRequest(wardrobeQuerySchema, 'query'), wardrobeController.list);
router.post('/upload-auth', wardrobeController.uploadAuth);
router.post('/', wardrobeController.create);
router.patch('/:id', wardrobeController.update);
router.delete('/:id', wardrobeController.remove);

module.exports = router;
