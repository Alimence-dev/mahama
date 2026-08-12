const express = require('express');
const { createRequest, listRequests, managerReview, donorReview, distributeRequest } = require('../controllers/requestController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', requireRole('volunteer', 'manager', 'donor'), listRequests);
router.post('/', requireRole('volunteer'), createRequest);
router.put('/:id/manager-review', requireRole('manager'), managerReview);
router.put('/:id/donor-review', requireRole('donor'), donorReview);
router.post('/:id/distribute', requireRole('volunteer'), distributeRequest);

module.exports = router;
