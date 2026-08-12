const express = require('express');
const { listDistributions } = require('../controllers/distributionController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRole('volunteer', 'manager', 'admin'), listDistributions);

module.exports = router;
