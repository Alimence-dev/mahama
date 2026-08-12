const pool = require('../config/db');

const CATEGORIES = ['Food', 'Hygiene', 'Clothing & Materials'];

async function listInventory(req, res) {
  const [rows] = await pool.query('SELECT * FROM inventory_items ORDER BY category, name');
  res.json(rows);
}

async function createItem(req, res) {
  const { name, category, quantity_available, unit, low_stock_threshold } = req.body;
  if (!name || !category || !unit || quantity_available === undefined) {
    return res.status(400).json({ message: 'name, category, unit, and quantity_available are required' });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `category must be one of ${CATEGORIES.join(', ')}` });
  }

  const [result] = await pool.query(
    'INSERT INTO inventory_items (name, category, quantity_available, unit, low_stock_threshold) VALUES (?, ?, ?, ?, ?)',
    [name, category, quantity_available, unit, low_stock_threshold ?? 10]
  );
  res.status(201).json({
    id: result.insertId,
    name,
    category,
    quantity_available,
    unit,
    low_stock_threshold: low_stock_threshold ?? 10,
  });
}

// quantity_available is intentionally not editable here — it only moves via restockItem
// (reason='restock') or, in Phase 4, distribution (reason='distribution'), each logged to inventory_log.
async function updateItem(req, res) {
  const { id } = req.params;
  const { unit, low_stock_threshold } = req.body;

  const [items] = await pool.query('SELECT id FROM inventory_items WHERE id = ?', [id]);
  if (!items[0]) return res.status(404).json({ message: 'Item not found' });

  await pool.query(
    'UPDATE inventory_items SET unit = COALESCE(?, unit), low_stock_threshold = COALESCE(?, low_stock_threshold) WHERE id = ?',
    [unit ?? null, low_stock_threshold ?? null, id]
  );
  res.json({ message: 'Item updated' });
}

async function restockItem(req, res) {
  const { id } = req.params;
  const { change_amount } = req.body;

  if (!Number.isInteger(change_amount) || change_amount <= 0) {
    return res.status(400).json({ message: 'change_amount must be a positive whole number' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [items] = await conn.query('SELECT id, quantity_available FROM inventory_items WHERE id = ? FOR UPDATE', [id]);
    const item = items[0];
    if (!item) {
      await conn.rollback();
      return res.status(404).json({ message: 'Item not found' });
    }

    const newQuantity = item.quantity_available + change_amount;
    await conn.query('UPDATE inventory_items SET quantity_available = ? WHERE id = ?', [newQuantity, id]);
    await conn.query(
      'INSERT INTO inventory_log (item_id, change_amount, reason, changed_by) VALUES (?, ?, ?, ?)',
      [id, change_amount, 'restock', req.user.id]
    );

    await conn.commit();
    res.json({ id: Number(id), quantity_available: newQuantity });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to restock item', error: err.message });
  } finally {
    conn.release();
  }
}

module.exports = { listInventory, createItem, updateItem, restockItem };
