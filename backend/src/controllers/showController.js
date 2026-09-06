const showRepo = require('../repositories/showRepo');
const { sendSuccess } = require('../utils/apiResponse');
const { NotFoundError } = require('../utils/errors');

const getShowsByEvent = async (req, res, next) => {
  try {
    const shows = await showRepo.findByEventId(req.params.eventId);
    return sendSuccess(res, 'Event shows retrieved successfully', { shows }, 200);
  } catch (err) {
    next(err);
  }
};

const getShowById = async (req, res, next) => {
  try {
    const show = await showRepo.findById(req.params.id);
    if (!show) {
      throw new NotFoundError('Show not found');
    }
    return sendSuccess(res, 'Show details retrieved successfully', { show }, 200);
  } catch (err) {
    next(err);
  }
};

const createShow = async (req, res, next) => {
  try {
    const newShow = await showRepo.create(req.body);
    return sendSuccess(res, 'Show and seating inventory created successfully', { show: newShow }, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getShowsByEvent,
  getShowById,
  createShow,
};
