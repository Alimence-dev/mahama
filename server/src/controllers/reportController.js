const pool = require('../config/db');

async function requestStatusSummary(req, res) {
  const [rows] = await pool.query(
    'SELECT status, COUNT(*) AS count FROM resource_requests GROUP BY status'
  );
  res.json(rows);
}

module.exports = { requestStatusSummary };
