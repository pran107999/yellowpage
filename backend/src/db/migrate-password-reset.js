/**
 * Migration: add password reset columns to users.
 * Run once: node src/db/migrate-password-reset.js
 */
require('dotenv').config();
const pool = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP
    `);
    console.log('Password reset columns added (or already exist).');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
