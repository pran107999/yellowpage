/**
 * Remove images that are actually SVG (saved with wrong extension) and re-seed.
 * Run: node src/db/fix-broken-images.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const UPLOADS_BASE = path.join(__dirname, '..', '..', 'uploads');

async function run() {
  try {
    const result = await pool.query(
      'SELECT id, classified_id, file_path FROM classified_images'
    );

    let removed = 0;
    for (const row of result.rows) {
      const absPath = path.join(UPLOADS_BASE, row.file_path);
      if (!fs.existsSync(absPath)) continue;

      const buf = fs.readFileSync(absPath, { encoding: null });
      const start = buf.slice(0, 100).toString('utf8');
      const isSvg = start.includes('<svg') || start.includes('<?xml');

      if (isSvg) {
        fs.unlinkSync(absPath);
        await pool.query('DELETE FROM classified_images WHERE id = $1', [row.id]);
        removed++;
        console.log(`  Removed broken: ${row.file_path}`);
      }
    }

    if (removed > 0) {
      console.log(`\nRemoved ${removed} broken image(s). Run 'npm run db:seed-images' to regenerate.`);
    } else {
      console.log('No broken SVG images found.');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
