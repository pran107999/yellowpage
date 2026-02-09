const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { emitClassifiedsChanged, emitAdminChanged } = require('../socket');

const getStats = async (req, res) => {
  try {
    const [users, classifieds, cities] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM classifieds'),
      pool.query('SELECT COUNT(*) as count FROM cities'),
    ]);
    const published = await pool.query(
      "SELECT COUNT(*) as count FROM classifieds WHERE status = 'published'"
    );
    
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalClassifieds: parseInt(classifieds.rows[0].count),
      publishedClassifieds: parseInt(published.rows[0].count),
      totalCities: parseInt(cities.rows[0].count),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const getAllClassifieds = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as author_name, u.email as author_email,
        COALESCE(
          (SELECT json_agg(json_build_object('id', ct.id, 'name', ct.name, 'state', ct.state))
           FROM classified_cities cc
           JOIN cities ct ON cc.city_id = ct.id
           WHERE cc.classified_id = c.id),
          '[]'::json
        ) as selected_cities
       FROM classifieds c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get classifieds error:', error);
    res.status(500).json({ error: 'Failed to fetch classifieds' });
  }
};

const updateClassifiedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await pool.query(
      'UPDATE classifieds SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Classified not found' });
    }
    emitClassifiedsChanged();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

const deleteClassifiedAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM classifieds WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Classified not found' });
    }
    emitClassifiedsChanged();
    res.json({ message: 'Classified deleted successfully' });
  } catch (error) {
    console.error('Delete classified error:', error);
    res.status(500).json({ error: 'Failed to delete classified' });
  }
};

const createCity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, state } = req.body;
    
    const result = await pool.query(
      'INSERT INTO cities (name, state) VALUES ($1, $2) RETURNING *',
      [name, state]
    );
    emitAdminChanged();
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'City already exists' });
    }
    console.error('Create city error:', error);
    res.status(500).json({ error: 'Failed to create city' });
  }
};

const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM cities WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }
    emitAdminChanged();
    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    console.error('Delete city error:', error);
    res.status(500).json({ error: 'Failed to delete city' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    if (id === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot demote yourself' });
    }
    
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, role',
      [role, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    emitAdminChanged();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};

module.exports = {
  getStats,
  getAllUsers,
  getAllClassifieds,
  updateClassifiedStatus,
  deleteClassifiedAdmin,
  createCity,
  deleteCity,
  updateUserRole,
};
