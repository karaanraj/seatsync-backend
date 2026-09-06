const express = require('express');
const router = express.Router();
const showController = require('../controllers/showController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createShowSchema } = require('../validators/eventValidator');

router.get('/event/:eventId', showController.getShowsByEvent);
router.get('/:id', showController.getShowById);
router.post('/', authenticate, requireAdmin, validate(createShowSchema), showController.createShow);

module.exports = router;
