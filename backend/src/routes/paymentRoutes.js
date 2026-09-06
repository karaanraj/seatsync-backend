const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { processPaymentSchema } = require('../validators/bookingValidator');

router.post('/', authenticate, validate(processPaymentSchema), paymentController.processPayment);

module.exports = router;
