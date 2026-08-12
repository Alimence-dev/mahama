const pool = require('../config/db');

async function listDistributions(req, res) {
  const [rows] = await pool.query(
    `SELECT dl.id, dl.request_id, dl.family_id, dl.distributed_at,
            rq.quantity_requested, i.name AS item_name, i.unit,
            h.name AS head_name,
            c.name AS collected_by_name,
            u.name AS distributed_by_name
     FROM distribution_log dl
     JOIN resource_requests rq ON rq.id = dl.request_id
     JOIN inventory_items i ON i.id = rq.item_id
     JOIN families f ON f.id = dl.family_id
     LEFT JOIN refugees h ON h.id = f.head_of_family_id
     JOIN refugees c ON c.id = dl.collected_by_id
     JOIN users u ON u.id = dl.distributed_by
     ORDER BY dl.distributed_at DESC`
  );
  res.json(rows);
}

module.exports = { listDistributions };
