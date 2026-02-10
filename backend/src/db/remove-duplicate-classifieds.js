/**
 * Remove duplicate classifieds (same title + user_id).
 * Keeps the earliest created; deletes duplicates and their images from disk.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const UPLOADS_BASE = path.join(__dirname, '..', '..', 'uploads');

async function run() {
  try {
    const dupes = await pool.query(`
      SELECT c.id, c.title, c.user_id, c.created_at
      FROM classifieds c
      WHERE (c.title, c.user_id) IN (
        SELECT title, user_id FROM classifieds GROUP BY title, user_id HAVING COUNT(*) > 1
      )
      ORDER BY c.title, c.user_id, c.created_at ASC
    `);

    if (dupes.rows.length === 0) {
      console.log('No duplicate classifieds found.');
      await pool.end();
      return;
    }

    const toDelete = [];
    let lastKey = null;
    for (const row of dupes.rows) {
      const key = `${row.title}|||${row.user_id}`;
      if (lastKey === key) {
        toDelete.push(row);
      }
      lastKey = key;
    }

    if (toDelete.length === 0) {
      console.log('No duplicates to remove (each group has only one).');
      await pool.end();
      return;
    }

    console.log(`Removing ${toDelete.length} duplicate classified(s)...`);
    for (const row of toDelete) {
      const imgRows = await pool.query('SELECT file_path FROM classified_images WHERE classified_id = $1', [row.id]);
      const filePaths = imgRows.rows.map(r => r.file_path);
      for (const fp of filePaths) {
        const absPath = path.join(UPLOADS_BASE, fp);
        if (fs.existsSync(absPath)) {
          fs.unlinkSync(absPath);
        }
      }
      const dir = path.join(UPLOADS_BASE, 'classifieds', row.id);
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
      await pool.query('DELETE FROM classifieds WHERE id = $1', [row.id]);
      console.log(`  Deleted duplicate: "${row.title}" (${row.id})`);
    }
    console.log('Done.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
