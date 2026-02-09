const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { emitClassifiedsChanged } = require('../socket');

// Public: Get published classifieds with optional city filter
const getClassifieds = async (req, res) => {
  try {
    const { cityId, category, search } = req.query;
    
    let query = `
      SELECT c.*, u.name as author_name, u.email as author_email,
        COALESCE(
          (SELECT json_agg(json_build_object('id', ct.id, 'name', ct.name, 'state', ct.state))
           FROM classified_cities cc
           JOIN cities ct ON cc.city_id = ct.id
           WHERE cc.classified_id = c.id),
          '[]'::json
        ) as selected_cities
      FROM classifieds c
      JOIN users u ON c.user_id = u.id
      WHERE c.status = 'published'
    `;
    const params = [];
    let paramIndex = 1;
    
    if (cityId) {
      query += ` AND (
        c.visibility = 'all_cities' 
        OR EXISTS (SELECT 1 FROM classified_cities cc WHERE cc.classified_id = c.id AND cc.city_id = $${paramIndex})
      )`;
      params.push(cityId);
      paramIndex++;
    }
    
    if (category) {
      query += ` AND c.category ILIKE $${paramIndex}`;
      params.push(`%${category}%`);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY c.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get classifieds error:', error);
    res.status(500).json({ error: 'Failed to fetch classifieds' });
  }
};

// Public: Get single classified
const getClassified = async (req, res) => {
  try {
    const { id } = req.params;
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
       WHERE c.id = $1 AND c.status = 'published'`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Classified not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get classified error:', error);
    res.status(500).json({ error: 'Failed to fetch classified' });
  }
};

// Protected: Create classified (user must be logged in)
const createClassified = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, description, category, contact_email, contact_phone, visibility, cityIds } = req.body;
    const userId = req.user.id;
    
    const result = await pool.query(
      `INSERT INTO classifieds (user_id, title, description, category, contact_email, contact_phone, visibility, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
       RETURNING *`,
      [userId, title, description, category, contact_email || null, contact_phone || null, visibility || 'all_cities']
    );
    
    const classified = result.rows[0];
    
    if (visibility === 'selected_cities' && cityIds && Array.isArray(cityIds) && cityIds.length > 0) {
      for (const cityId of cityIds) {
        await pool.query(
          'INSERT INTO classified_cities (classified_id, city_id) VALUES ($1, $2)',
          [classified.id, cityId]
        );
      }
    }

    emitClassifiedsChanged();
    res.status(201).json(classified);
  } catch (error) {
    console.error('Create classified error:', error);
    res.status(500).json({ error: 'Failed to create classified' });
  }
};

// Protected: Get user's own classifieds
const getMyClassifieds = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', ct.id, 'name', ct.name, 'state', ct.state))
           FROM classified_cities cc
           JOIN cities ct ON cc.city_id = ct.id
           WHERE cc.classified_id = c.id),
          '[]'::json
        ) as selected_cities
       FROM classifieds c
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get my classifieds error:', error);
    res.status(500).json({ error: 'Failed to fetch classifieds' });
  }
};

// Protected: Update own classified
const updateClassified = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { title, description, category, contact_email, contact_phone, visibility, status, cityIds } = req.body;
    
    const check = await pool.query(
      'SELECT id FROM classifieds WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Classified not found or access denied' });
    }
    
    const updates = [];
    const params = [id];
    let paramIndex = 2;
    
    if (title !== undefined) { updates.push(`title = $${paramIndex++}`); params.push(title); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); params.push(description); }
    if (category !== undefined) { updates.push(`category = $${paramIndex++}`); params.push(category); }
    if (contact_email !== undefined) { updates.push(`contact_email = $${paramIndex++}`); params.push(contact_email); }
    if (contact_phone !== undefined) { updates.push(`contact_phone = $${paramIndex++}`); params.push(contact_phone); }
    if (visibility !== undefined) { updates.push(`visibility = $${paramIndex++}`); params.push(visibility); }
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); params.push(status); }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    if (updates.length > 1) {
      await pool.query(
        `UPDATE classifieds SET ${updates.join(', ')} WHERE id = $1`,
        params
      );
    }
    
    if (visibility !== undefined) {
      await pool.query('DELETE FROM classified_cities WHERE classified_id = $1', [id]);
      if (visibility === 'selected_cities' && cityIds && Array.isArray(cityIds) && cityIds.length > 0) {
        for (const cityId of cityIds) {
          await pool.query(
            'INSERT INTO classified_cities (classified_id, city_id) VALUES ($1, $2)',
            [id, cityId]
          );
        }
      }
    }
    
    const result = await pool.query(
      `SELECT c.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', ct.id, 'name', ct.name, 'state', ct.state))
           FROM classified_cities cc
           JOIN cities ct ON cc.city_id = ct.id
           WHERE cc.classified_id = c.id),
          '[]'::json
        ) as selected_cities
       FROM classifieds c WHERE c.id = $1`,
      [id]
    );
    emitClassifiedsChanged();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update classified error:', error);
    res.status(500).json({ error: 'Failed to update classified' });
  }
};

// Protected: Delete own classified
const deleteClassified = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM classifieds WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Classified not found or access denied' });
    }
    emitClassifiedsChanged();
    res.json({ message: 'Classified deleted successfully' });
  } catch (error) {
    console.error('Delete classified error:', error);
    res.status(500).json({ error: 'Failed to delete classified' });
  }
};

module.exports = {
  getClassifieds,
  getClassified,
  createClassified,
  getMyClassifieds,
  updateClassified,
  deleteClassified,
};
