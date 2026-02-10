const { Pool } = require('pg');

// Default: use system username on Mac (Postgres default); override with DATABASE_URL
const defaultUrl = process.env.DATABASE_URL || `postgresql://${process.env.USER || 'postgres'}@localhost:5432/desinetwork`;
const isSupabase = defaultUrl.includes('supabase.com') || defaultUrl.includes('supabase.co');
const pool = new Pool({
  connectionString: defaultUrl,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
