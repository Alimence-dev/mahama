const express = require('express');
const { requestStatusSummary } = require('../controllers/reportController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/request-status-summary', authenticate, requireRole('admin', 'manager'), requestStatusSummary);

module.exports = router;
