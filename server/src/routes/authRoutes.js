const router = require('express').Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { signupLimiter, loginLimiter } = require('../middleware/rateLimiter');
const { signupSchema, loginSchema, emailSchema, resetPasswordSchema } = require('../validators/authValidators');

router.post('/signup', signupLimiter, validateRequest(signupSchema), authController.signup);
router.get('/verify-email', authController.verifyEmail);
router.post('/login', loginLimiter, validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-everywhere', authMiddleware, authController.logoutEverywhere);
router.post('/forgot-password', validateRequest(emailSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

module.exports = router;
