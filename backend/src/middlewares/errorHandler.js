const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message = 'Internal server error', errorCode = 'SERVER_ERROR', details = null } = err;

  // Log all non-operational or 500 errors
  if (!err.isOperational || statusCode >= 500) {
    logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, {
      message: err.message,
      stack: err.stack,
    });
  } else {
    logger.warn(`[Client Error] ${req.method} ${req.originalUrl} (${statusCode}): ${message}`);
  }

  // Sanitize message in production for 500s
  if (env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected server error occurred. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    ...(details ? { details } : {}),
  });
};

module.exports = errorHandler;
