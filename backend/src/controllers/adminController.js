const AdminService = require('../services/adminService');
const userRepo = require('../repositories/userRepo');
const { sendSuccess } = require('../utils/apiResponse');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await AdminService.getDashboardStats();
    return sendSuccess(res, 'Admin metrics retrieved', stats, 200);
  } catch (err) {
    next(err);
  }
};

const getAdminBookings = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await AdminService.getAllBookings({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status: status || null,
    });
    return sendSuccess(res, 'Admin bookings retrieved', result, 200);
  } catch (err) {
    next(err);
  }
};

const getAdminUsers = async (req, res, next) => {
  try {
    const users = await userRepo.getAllUsers();
    return sendSuccess(res, 'System users retrieved', { users }, 200);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getAdminBookings,
  getAdminUsers,
};
