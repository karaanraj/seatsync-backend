const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const idempotency = require('../middlewares/idempotency');
const { createBookingSchema, cancelBookingSchema } = require('../validators/bookingValidator');
const { bookingLimiter } = require('../middlewares/rateLimiter');

router.post('/', authenticate, bookingLimiter, idempotency, validate(createBookingSchema), bookingController.createBooking);
router.get('/', authenticate, bookingController.getMyBookings);
router.get('/:id', authenticate, bookingController.getBookingById);
router.post('/:id/cancel', authenticate, validate(cancelBookingSchema), bookingController.cancelBooking);

module.exports = router;
