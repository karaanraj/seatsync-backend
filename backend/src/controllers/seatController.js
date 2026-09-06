const SeatLockService = require('../services/seatLockService');
const { sendSuccess } = require('../utils/apiResponse');

const getShowSeats = async (req, res, next) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const data = await SeatLockService.getShowSeatsWithLockStatus(req.params.showId, currentUserId);
    return sendSuccess(res, 'Show seating inventory with real-time locks retrieved', data, 200);
  } catch (err) {
    next(err);
  }
};

const lockSeats = async (req, res, next) => {
  try {
    const { seatIds } = req.body;
    const userId = req.user.id;
    const result = await SeatLockService.lockSeats(req.params.showId, seatIds, userId);
    return sendSuccess(res, 'Seats temporarily locked for booking session', result, 200);
  } catch (err) {
    next(err);
  }
};

const releaseSeats = async (req, res, next) => {
  try {
    const { seatIds } = req.body;
    const userId = req.user.id;
    const result = await SeatLockService.releaseSeats(req.params.showId, seatIds, userId);
    return sendSuccess(res, 'Seats released successfully', result, 200);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getShowSeats,
  lockSeats,
  releaseSeats,
};
