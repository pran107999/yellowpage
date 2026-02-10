/**
 * Find classifieds without images and create placeholder images based on their title.
 * Uses placehold.co to generate images, saves to uploads/, inserts into classified_images.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const { randomUUID } = require('crypto');
const pool = require('../config/db');

const UPLOADS_BASE = path.join(__dirname, '..', '..', 'uploads');
const IMG_WIDTH = 640;
const IMG_HEIGHT = 480;
const BG_COLOR = '1e293b';   // slate-800
const TEXT_COLOR = 'fbbf24'; // amber-400

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function slugify(title) {
  // Truncate and sanitize for URL (placehold.co has limits)
  const truncated = String(title).slice(0, 80).replace(/[^\w\s-]/g, '').replace(/\s+/g, '+');
  return truncated || 'Classified';
}

async function run() {
  try {
    const result = await pool.query(`
      SELECT c.id, c.title, c.category
      FROM classifieds c
      WHERE NOT EXISTS (
        SELECT 1 FROM classified_images ci WHERE ci.classified_id = c.id
      )
    `);

    const classifieds = result.rows;
    if (classifieds.length === 0) {
      console.log('All classifieds already have images. Nothing to do.');
      return;
    }

    console.log(`Found ${classifieds.length} classified(s) without images. Creating placeholder images...`);

    for (const row of classifieds) {
      const text = encodeURIComponent(slugify(row.title).replace(/\+/g, ' '));
      const url = `https://placehold.co/${IMG_WIDTH}x${IMG_HEIGHT}/${BG_COLOR}/${TEXT_COLOR}.png?text=${text}&font=source-sans-3`;
      
      const buffer = await fetchImage(url);
      const dir = path.join(UPLOADS_BASE, 'classifieds', row.id);
      fs.mkdirSync(dir, { recursive: true });
      
      const filename = `${randomUUID()}.png`;
      const relPath = `classifieds/${row.id}/${filename}`;
      const absPath = path.join(UPLOADS_BASE, relPath);
      fs.writeFileSync(absPath, buffer);

      await pool.query(
        'INSERT INTO classified_images (classified_id, file_path, sort_order) VALUES ($1, $2, 0)',
        [row.id, relPath]
      );
      console.log(`  ✓ Added image for: "${row.title}"`);
    }

    console.log(`Done. Created ${classifieds.length} image(s).`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
