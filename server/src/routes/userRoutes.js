const router = require('express').Router();
const userController = require('../controllers/userController');

router.get('/me', userController.getMe);
router.patch('/me/preferences', userController.updatePreferences);

module.exports = router;
