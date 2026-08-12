const express = require('express');
const { register, login } = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register', authenticate, requireRole('admin'), register);

module.exports = router;
