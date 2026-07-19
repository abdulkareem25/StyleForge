const router = require('express').Router();
const wardrobeController = require('../controllers/wardrobeController');

router.get('/', wardrobeController.list);
router.post('/upload-auth', wardrobeController.uploadAuth);
router.post('/', wardrobeController.create);
router.patch('/:id', wardrobeController.update);
router.delete('/:id', wardrobeController.remove);

module.exports = router;
