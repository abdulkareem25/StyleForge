const router = require('express').Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/me', userController.getMe);
router.patch('/me/preferences', userController.updatePreferences);

module.exports = router;
