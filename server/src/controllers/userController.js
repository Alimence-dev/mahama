const pool = require('../config/db');

async function listUsers(req, res) {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(rows);
}

module.exports = { listUsers };
