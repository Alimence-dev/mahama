const express = require('express');
const { listInventory, createItem, updateItem, restockItem } = require('../controllers/inventoryController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', requireRole('volunteer', 'manager', 'donor', 'admin'), listInventory);
router.post('/', requireRole('volunteer'), createItem);
router.put('/:id', requireRole('volunteer'), updateItem);
router.post('/:id/restock', requireRole('admin'), restockItem);

module.exports = router;
