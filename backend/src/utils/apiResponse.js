/**
 * Standard API Response helpers
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
  };
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

const sendError = (res, message, statusCode = 500, errorCode = 'SERVER_ERROR', details = null) => {
  const response = {
    success: false,
    message,
    errorCode,
  };
  if (details) {
    response.details = details;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};
