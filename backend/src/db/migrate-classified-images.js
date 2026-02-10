require('dotenv').config();
const pool = require('../config/db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classified_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        classified_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
        file_path VARCHAR(500) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_classified_images_classified_id ON classified_images(classified_id)
    `);
    console.log('Classified images migration completed!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
