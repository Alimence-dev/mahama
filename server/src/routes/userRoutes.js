const express = require('express');
const { listUsers } = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRole('admin'), listUsers);

module.exports = router;
