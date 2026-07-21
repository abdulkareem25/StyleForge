const router = require('express').Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

// All admin routes require authentication + admin role
router.use(authMiddleware);
router.use(roleCheck('admin'));

router.get('/metrics', adminController.getMetrics);
router.get('/users', adminController.listUsers);
router.post('/users/:userId/disable', adminController.disableAccount);
router.post('/users/:userId/restore', adminController.restoreAccount);

module.exports = router;
