const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/rbac');

router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboardStats);
router.get('/bookings', authenticate, requireAdmin, adminController.getAdminBookings);
router.get('/users', authenticate, requireAdmin, adminController.getAdminUsers);

module.exports = router;
