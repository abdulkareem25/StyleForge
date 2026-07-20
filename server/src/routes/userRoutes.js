const router = require('express').Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { deleteAccountLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);

router.get('/me', userController.getMe);
router.patch('/me/preferences', userController.updatePreferences);
router.delete('/me', deleteAccountLimiter, userController.deleteAccount);
router.post('/restore', userController.restoreAccount);

module.exports = router;
