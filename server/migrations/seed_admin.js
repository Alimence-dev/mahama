const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('../src/config/db');

const [name, email, password] = process.argv.slice(2);

async function seed() {
  if (!name || !email || !password) {
    console.error('Usage: node migrations/seed_admin.js "<name>" <email> <password>');
    process.exit(1);
  }

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    console.log('A user with this email already exists. Nothing to do.');
    process.exit(0);
  }

  const password_hash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, password_hash, 'admin']
  );

  console.log(`Admin user created: ${email}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
