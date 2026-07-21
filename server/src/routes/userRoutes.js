const router = require('express').Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { preferencesSchema } = require('../validators/authValidators');
const { deleteAccountLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);

router.get('/me', userController.getMe);
router.patch('/me/preferences', validateRequest(preferencesSchema), userController.updatePreferences);
router.delete('/me', deleteAccountLimiter, userController.deleteAccount);
router.post('/restore', userController.restoreAccount);

module.exports = router;
