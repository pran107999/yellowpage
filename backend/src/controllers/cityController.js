const pool = require('../config/db');

const getCities = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cities ORDER BY state, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
};

module.exports = { getCities };
