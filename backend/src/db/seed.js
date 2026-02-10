require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const cities = [
  { name: 'New York', state: 'NY' },
  { name: 'Los Angeles', state: 'CA' },
  { name: 'Chicago', state: 'IL' },
  { name: 'Houston', state: 'TX' },
  { name: 'Phoenix', state: 'AZ' },
  { name: 'Philadelphia', state: 'PA' },
  { name: 'San Antonio', state: 'TX' },
  { name: 'San Diego', state: 'CA' },
  { name: 'Dallas', state: 'TX' },
  { name: 'San Jose', state: 'CA' },
  { name: 'Austin', state: 'TX' },
  { name: 'Jacksonville', state: 'FL' },
];

async function seed() {
  try {
    // Seed once: skip only if sample classifieds already exist
    const classifiedsCheck = await pool.query(
      "SELECT 1 FROM classifieds WHERE title = 'Plumber Services - Fast & Reliable' LIMIT 1"
    );
    if (classifiedsCheck.rows.length > 0) {
      console.log('Database already seeded with sample data. Skipping.');
      return;
    }

    // Create admin user (password: admin123)
    const adminHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      ['admin@desinetwork.com', adminHash, 'Admin User', 'admin']
    );
    console.log('Admin user created: admin@desinetwork.com / admin123');

    // Create test user (password: user123)
    const userHash = await bcrypt.hash('user123', 10);
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['user@desinetwork.com', userHash, 'Test User', 'user']
    );
    const userId = userResult.rows[0]?.id;

    // Seed cities
    for (const city of cities) {
      await pool.query(
        `INSERT INTO cities (name, state) VALUES ($1, $2) ON CONFLICT (name, state) DO NOTHING`,
        [city.name, city.state]
      );
    }
    console.log(`${cities.length} cities seeded`);

    // Get city IDs for sample classifieds
    const citiesResult = await pool.query('SELECT id FROM cities LIMIT 3');
    const cityIds = citiesResult.rows.map(r => r.id);

    if (userId) {
      // Create sample classifieds
      await pool.query(
        `INSERT INTO classifieds (user_id, title, description, category, contact_email, contact_phone, visibility, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, 'Plumber Services - Fast & Reliable', 'Professional plumbing services for residential and commercial. 24/7 emergency service available.', 'Services', 'contact@plumber.com', '555-0100', 'all_cities', 'published']
      );
      const classifiedResult = await pool.query(
        `INSERT INTO classifieds (user_id, title, description, category, contact_email, contact_phone, visibility, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [userId, 'Restaurant for Sale - Downtown', 'Prime location restaurant with full kitchen. Great foot traffic. Call for details.', 'Real Estate', 'sale@restaurant.com', '555-0200', 'selected_cities', 'published']
      );
      const classifiedId = classifiedResult.rows[0].id;
      for (const cityId of cityIds) {
        await pool.query('INSERT INTO classified_cities (classified_id, city_id) VALUES ($1, $2)', [classifiedId, cityId]);
      }
      console.log('Sample classifieds created');
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
