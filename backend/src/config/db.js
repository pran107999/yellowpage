const { Pool } = require('pg');

// Default: use system username on Mac (Postgres default); override with DATABASE_URL
const defaultUrl = process.env.DATABASE_URL || `postgresql://${process.env.USER || 'postgres'}@localhost:5432/yellowpage`;
const pool = new Pool({
  connectionString: defaultUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
