const PaymentService = require('../services/paymentService');
const { sendSuccess } = require('../utils/apiResponse');

const processPayment = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod, simulateOutcome } = req.body;
    const result = await PaymentService.processPayment({
      bookingId,
      paymentMethod,
      simulateOutcome,
    });
    return sendSuccess(res, 'Payment processed', result, 200);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  processPayment,
};
