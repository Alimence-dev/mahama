const pool = require('../config/db');

async function listNotifications(req, res) {
  const [rows] = await pool.query(
    `SELECT n.id, n.family_id, n.channel, n.status, n.created_at, n.external_response,
            h.name AS head_name
     FROM notifications n
     JOIN families f ON f.id = n.family_id
     LEFT JOIN refugees h ON h.id = f.head_of_family_id
     ORDER BY n.created_at DESC`
  );
  res.json(rows);
}

async function getNotification(req, res) {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'Notification not found' });
  res.json(rows[0]);
}

module.exports = { listNotifications, getNotification };
