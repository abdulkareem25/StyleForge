const router = require('express').Router();
const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const { signupLimiter } = require('../middleware/rateLimiter');
const { signupSchema, loginSchema, emailSchema, resetPasswordSchema } = require('../validators/authValidators');

router.post('/signup', signupLimiter, validateRequest(signupSchema), authController.signup);
router.get('/verify-email', authController.verifyEmail);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', validateRequest(emailSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

module.exports = router;
