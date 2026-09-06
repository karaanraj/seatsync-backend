const BookingService = require('../services/bookingService');
const bookingRepo = require('../repositories/bookingRepo');
const { sendSuccess } = require('../utils/apiResponse');
const { NotFoundError } = require('../utils/errors');

const createBooking = async (req, res, next) => {
  try {
    const { showId, seatIds, customerDetails } = req.body;
    const userId = req.user.id;
    const idempotencyKey = req.headers['idempotency-key'] || null;

    const booking = await BookingService.createBooking({
      userId,
      showId,
      seatIds,
      idempotencyKey,
      customerDetails,
    });

    return sendSuccess(res, 'Booking initiated successfully', { booking }, 201);
  } catch (err) {
    next(err);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await bookingRepo.findByUserId(req.user.id);
    return sendSuccess(res, 'User bookings retrieved successfully', { bookings }, 200);
  } catch (err) {
    next(err);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingRepo.findById(req.params.id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    // Check permission: owner or admin
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own bookings.',
        errorCode: 'FORBIDDEN',
      });
    }
    return sendSuccess(res, 'Booking details retrieved successfully', { booking }, 200);
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const result = await BookingService.cancelBooking(req.params.id, req.user.id, isAdmin);
    return sendSuccess(res, 'Booking cancelled successfully', result, 200);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
};
