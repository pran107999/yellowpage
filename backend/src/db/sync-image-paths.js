/**
 * Fix classified_images records that point to non-existent files.
 * If the DB points to file X but disk has file Y, updates DB to point to Y.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const UPLOADS_BASE = path.join(__dirname, '..', '..', 'uploads');

async function run() {
  try {
    const rows = await pool.query(
      'SELECT id, classified_id, file_path FROM classified_images'
    );

    let fixed = 0;
    for (const row of rows.rows) {
      const absPath = path.join(UPLOADS_BASE, row.file_path);
      if (fs.existsSync(absPath)) continue;

      const dir = path.dirname(absPath);
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir);
      if (files.length === 0) continue;

      const newRelPath = path.join(path.dirname(row.file_path), files[0]).replace(/\\/g, '/');
      await pool.query('UPDATE classified_images SET file_path = $1 WHERE id = $2', [newRelPath, row.id]);
      fixed++;
      console.log(`  Fixed: ${row.file_path} → ${newRelPath}`);
    }

    console.log(fixed ? `Fixed ${fixed} path(s).` : 'All image paths valid.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
