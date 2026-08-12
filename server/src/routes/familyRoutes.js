const express = require('express');
const {
  createFamily,
  listFamilies,
  getFamily,
  updateFamily,
  addMember,
  updateMember,
} = require('../controllers/familyController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', requireRole('volunteer', 'manager'), listFamilies);
router.get('/:id', requireRole('volunteer', 'manager'), getFamily);
router.post('/', requireRole('volunteer'), createFamily);
router.put('/:id', requireRole('volunteer'), updateFamily);
router.post('/:id/members', requireRole('volunteer'), addMember);
router.put('/:id/members/:memberId', requireRole('volunteer'), updateMember);

module.exports = router;
