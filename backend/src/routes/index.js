const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const eventRoutes = require('./eventRoutes');
const showRoutes = require('./showRoutes');
const seatRoutes = require('./seatRoutes');
const bookingRoutes = require('./bookingRoutes');
const paymentRoutes = require('./paymentRoutes');
const adminRoutes = require('./adminRoutes');
const concurrencyDemoRoutes = require('./concurrencyDemoRoutes');

// API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'SeatSync High-Concurrency Booking Engine',
  });
});

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/shows', showRoutes);
router.use('/shows', seatRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/concurrency', concurrencyDemoRoutes);

module.exports = router;
