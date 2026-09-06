const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createEventSchema } = require('../validators/eventValidator');

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', authenticate, requireAdmin, validate(createEventSchema), eventController.createEvent);
router.patch('/:id', authenticate, requireAdmin, eventController.updateEvent);
router.delete('/:id', authenticate, requireAdmin, eventController.deleteEvent);

module.exports = router;
