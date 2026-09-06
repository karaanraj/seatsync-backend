const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { lockSeatsSchema, releaseSeatsSchema } = require('../validators/seatValidator');
const { bookingLimiter } = require('../middlewares/rateLimiter');

router.get('/:showId/seats', optionalAuth, seatController.getShowSeats);
router.post('/:showId/seats/lock', authenticate, bookingLimiter, validate(lockSeatsSchema), seatController.lockSeats);
router.delete('/:showId/seats/lock', authenticate, validate(releaseSeatsSchema), seatController.releaseSeats);

module.exports = router;
