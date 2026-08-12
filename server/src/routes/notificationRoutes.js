const express = require('express');
const { listNotifications, getNotification } = require('../controllers/notificationController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole('volunteer'));

router.get('/', listNotifications);
router.get('/:id', getNotification);

module.exports = router;
