const express = require('express');
const router = express.Router();
const concurrencyDemoController = require('../controllers/concurrencyDemoController');

router.post('/simulate-race', concurrencyDemoController.simulateRaceCondition);

module.exports = router;
