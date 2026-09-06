const eventRepo = require('../repositories/eventRepo');
const showRepo = require('../repositories/showRepo');
const { sendSuccess } = require('../utils/apiResponse');
const { NotFoundError } = require('../utils/errors');

const getAllEvents = async (req, res, next) => {
  try {
    const { search, category, location, sortBy } = req.query;
    const events = await eventRepo.findAll({ search, category, location, sortBy });
    return sendSuccess(res, 'Events retrieved successfully', { events }, 200);
  } catch (err) {
    next(err);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await eventRepo.findById(req.params.id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    return sendSuccess(res, 'Event details retrieved successfully', { event }, 200);
  } catch (err) {
    next(err);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const newEvent = await eventRepo.create(req.body);
    return sendSuccess(res, 'Event created successfully', { event: newEvent }, 201);
  } catch (err) {
    next(err);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const updated = await eventRepo.update(req.params.id, req.body);
    if (!updated) {
      throw new NotFoundError('Event not found');
    }
    return sendSuccess(res, 'Event updated successfully', { event: updated }, 200);
  } catch (err) {
    next(err);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const success = await eventRepo.remove(req.params.id);
    if (!success) {
      throw new NotFoundError('Event not found');
    }
    return sendSuccess(res, 'Event deactivated successfully', null, 200);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
