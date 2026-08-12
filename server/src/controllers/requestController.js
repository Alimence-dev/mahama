const pool = require('../config/db');
const { notifyFamily } = require('../services/notifications');

async function createRequest(req, res) {
  const { family_id, item_id, quantity_requested } = req.body;

  if (!family_id || !item_id || !Number.isInteger(quantity_requested) || quantity_requested <= 0) {
    return res.status(400).json({ message: 'family_id, item_id, and a positive whole-number quantity_requested are required' });
  }

  const [families] = await pool.query('SELECT id FROM families WHERE id = ?', [family_id]);
  if (!families[0]) return res.status(404).json({ message: 'Family not found' });

  const [items] = await pool.query('SELECT id, quantity_available, unit FROM inventory_items WHERE id = ?', [item_id]);
  const item = items[0];
  if (!item) return res.status(404).json({ message: 'Inventory item not found' });

  if (quantity_requested > item.quantity_available) {
    return res.status(400).json({
      message: `Requested quantity (${quantity_requested} ${item.unit}) exceeds available stock (${item.quantity_available} ${item.unit})`,
    });
  }

  const [result] = await pool.query(
    'INSERT INTO resource_requests (family_id, requested_by, item_id, quantity_requested, status) VALUES (?, ?, ?, ?, ?)',
    [family_id, req.user.id, item_id, quantity_requested, 'pending']
  );

  req.app.get('io').emit('request-updated', { id: result.insertId, status: 'pending' });
  res.status(201).json({ id: result.insertId, family_id, item_id, quantity_requested, status: 'pending' });
}

async function listRequests(req, res) {
  const [rows] = await pool.query(
    `SELECT r.id, r.family_id, r.item_id, r.quantity_requested, r.status, r.created_at,
            f.family_size, f.head_of_family_id, f.secondary_contact_id,
            h.name AS head_name, sc.name AS secondary_contact_name,
            i.name AS item_name, i.unit,
            u.name AS requested_by_name
     FROM resource_requests r
     JOIN families f ON f.id = r.family_id
     LEFT JOIN refugees h ON h.id = f.head_of_family_id
     LEFT JOIN refugees sc ON sc.id = f.secondary_contact_id
     JOIN inventory_items i ON i.id = r.item_id
     JOIN users u ON u.id = r.requested_by
     ORDER BY r.created_at DESC`
  );
  res.json(rows);
}

async function managerReview(req, res) {
  const { id } = req.params;
  const { approve } = req.body;

  const [requests] = await pool.query('SELECT id, status FROM resource_requests WHERE id = ?', [id]);
  const request = requests[0];
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'pending') {
    return res.status(409).json({ message: `Request is '${request.status}', expected 'pending'` });
  }

  const newStatus = approve ? 'manager_approved' : 'rejected';
  await pool.query('UPDATE resource_requests SET status = ? WHERE id = ?', [newStatus, id]);
  req.app.get('io').emit('request-updated', { id: Number(id), status: newStatus });
  res.json({ id: Number(id), status: newStatus });
}

async function donorReview(req, res) {
  const { id } = req.params;
  const { approve } = req.body;

  const [requests] = await pool.query('SELECT id, status FROM resource_requests WHERE id = ?', [id]);
  const request = requests[0];
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'manager_approved') {
    return res.status(409).json({ message: `Request is '${request.status}', expected 'manager_approved'` });
  }

  const newStatus = approve ? 'donor_approved' : 'rejected';
  await pool.query('UPDATE resource_requests SET status = ? WHERE id = ?', [newStatus, id]);
  req.app.get('io').emit('request-updated', { id: Number(id), status: newStatus });
  res.json({ id: Number(id), status: newStatus });
}

async function distributeRequest(req, res) {
  const { id } = req.params;
  const { collected_by_id } = req.body;

  if (!collected_by_id) {
    return res.status(400).json({ message: 'collected_by_id is required' });
  }

  const conn = await pool.getConnection();
  let committed = false;
  let notifyArgs;
  try {
    await conn.beginTransaction();

    const [requests] = await conn.query(
      `SELECT r.id, r.status, r.family_id, r.item_id, r.quantity_requested,
              i.name AS item_name, i.unit, i.quantity_available
       FROM resource_requests r
       JOIN inventory_items i ON i.id = r.item_id
       WHERE r.id = ? FOR UPDATE`,
      [id]
    );
    const request = requests[0];
    if (!request) {
      await conn.rollback();
      return res.status(404).json({ message: 'Request not found' });
    }
    if (request.status !== 'donor_approved') {
      await conn.rollback();
      return res.status(409).json({ message: `Request is '${request.status}', expected 'donor_approved'` });
    }
    if (request.quantity_available < request.quantity_requested) {
      await conn.rollback();
      return res.status(409).json({ message: 'Insufficient stock to complete this distribution' });
    }

    const [families] = await conn.query(
      `SELECT f.id, f.head_of_family_id, f.secondary_contact_id,
              h.name AS head_name, h.phone_number AS head_phone
       FROM families f
       LEFT JOIN refugees h ON h.id = f.head_of_family_id
       WHERE f.id = ?`,
      [request.family_id]
    );
    const family = families[0];

    const validCollectors = [family.head_of_family_id, family.secondary_contact_id].filter(Boolean);
    if (!validCollectors.includes(Number(collected_by_id))) {
      await conn.rollback();
      return res.status(400).json({ message: "collected_by_id must be this family's head or secondary contact" });
    }

    await conn.query('UPDATE resource_requests SET status = ? WHERE id = ?', ['distributed', id]);
    await conn.query(
      'INSERT INTO distribution_log (request_id, family_id, distributed_by, collected_by_id) VALUES (?, ?, ?, ?)',
      [id, request.family_id, req.user.id, collected_by_id]
    );

    const newQuantity = request.quantity_available - request.quantity_requested;
    await conn.query('UPDATE inventory_items SET quantity_available = ? WHERE id = ?', [newQuantity, request.item_id]);
    await conn.query(
      'INSERT INTO inventory_log (item_id, change_amount, reason, changed_by) VALUES (?, ?, ?, ?)',
      [request.item_id, -request.quantity_requested, 'distribution', req.user.id]
    );

    await conn.commit();
    committed = true;

    notifyArgs = {
      familyId: request.family_id,
      headName: family.head_name,
      headPhone: family.head_phone,
      itemName: request.item_name,
      quantity: request.quantity_requested,
      unit: request.unit,
      distributedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (!committed) await conn.rollback();
    return res.status(500).json({ message: 'Failed to record distribution', error: err.message });
  } finally {
    conn.release();
  }

  const notification = await notifyFamily(notifyArgs);
  req.app.get('io').emit('request-updated', { id: Number(id), status: 'distributed' });
  res.status(201).json({ request_id: Number(id), status: 'distributed', notification });
}

module.exports = { createRequest, listRequests, managerReview, donorReview, distributeRequest };
