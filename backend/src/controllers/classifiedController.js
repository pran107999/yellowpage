const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { emitClassifiedsChanged } = require('../socket');

const UPLOADS_BASE = path.join(__dirname, '..', '..', 'uploads');

function parseBodyField(val) {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

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
        ) as selected_cities,
        COALESCE(
          (SELECT json_agg(json_build_object('id', ci.id, 'url', '/api/uploads/' || ci.file_path) ORDER BY ci.sort_order)
           FROM classified_images ci WHERE ci.classified_id = c.id),
          '[]'::json
        ) as images
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
        ) as selected_cities,
        COALESCE(
          (SELECT json_agg(json_build_object('id', ci.id, 'url', '/api/uploads/' || ci.file_path) ORDER BY ci.sort_order)
           FROM classified_images ci WHERE ci.classified_id = c.id),
          '[]'::json
        ) as images
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
    const rawCityIds = parseBodyField(req.body.cityIds);
    const cityIds = Array.isArray(rawCityIds) ? rawCityIds : (rawCityIds ? [rawCityIds] : []);
    const { title, description, category, contact_email, contact_phone, visibility } = req.body;
    const userId = req.user.id;
    
    const result = await pool.query(
      `INSERT INTO classifieds (user_id, title, description, category, contact_email, contact_phone, visibility, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
       RETURNING *`,
      [userId, title, description, category, contact_email || null, contact_phone || null, visibility || 'all_cities']
    );
    
    const classified = result.rows[0];
    
    if (visibility === 'selected_cities' && cityIds.length > 0) {
      for (const cityId of cityIds) {
        await pool.query(
          'INSERT INTO classified_cities (classified_id, city_id) VALUES ($1, $2)',
          [classified.id, cityId]
        );
      }
    }

    const files = req.files?.images || [];
    if (files.length > 0) {
      const dir = path.join(UPLOADS_BASE, 'classifieds', classified.id);
      fs.mkdirSync(dir, { recursive: true });
      for (let i = 0; i < files.length; i++) {
        const ext = path.extname(files[i].originalname) || '.jpg';
        const filename = `${randomUUID()}${ext}`;
        const relPath = path.join('classifieds', classified.id, filename);
        const absPath = path.join(UPLOADS_BASE, relPath);
        fs.writeFileSync(absPath, files[i].buffer);
        await pool.query(
          'INSERT INTO classified_images (classified_id, file_path, sort_order) VALUES ($1, $2, $3)',
          [classified.id, relPath.replace(/\\/g, '/'), i]
        );
      }
    }

    const withImages = await pool.query(
      `SELECT c.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', ci.id, 'url', '/api/uploads/' || ci.file_path) ORDER BY ci.sort_order)
           FROM classified_images ci WHERE ci.classified_id = c.id),
          '[]'::json
        ) as images
       FROM classifieds c WHERE c.id = $1`,
      [classified.id]
    );
    emitClassifiedsChanged();
    res.status(201).json(withImages.rows[0] || classified);
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
        ) as selected_cities,
        COALESCE(
          (SELECT json_agg(json_build_object('id', ci.id, 'url', '/api/uploads/' || ci.file_path) ORDER BY ci.sort_order)
           FROM classified_images ci WHERE ci.classified_id = c.id),
          '[]'::json
        ) as images
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
    const rawCityIds = parseBodyField(req.body.cityIds);
    const cityIds = Array.isArray(rawCityIds) ? rawCityIds : (rawCityIds ? [rawCityIds] : []);
    const rawRemoveIds = parseBodyField(req.body.removeImageIds);
    const removeImageIds = Array.isArray(rawRemoveIds) ? rawRemoveIds : (rawRemoveIds ? [rawRemoveIds] : []);
    const { title, description, category, contact_email, contact_phone, visibility, status } = req.body;
    
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
    
    await pool.query(
        `UPDATE classifieds SET ${updates.join(', ')} WHERE id = $1`,
        params
      );
    
    if (visibility !== undefined) {
      await pool.query('DELETE FROM classified_cities WHERE classified_id = $1', [id]);
      if (visibility === 'selected_cities' && cityIds.length > 0) {
        for (const cityId of cityIds) {
          await pool.query(
            'INSERT INTO classified_cities (classified_id, city_id) VALUES ($1, $2)',
            [id, cityId]
          );
        }
      }
    }

    if (removeImageIds.length > 0) {
      const imgResult = await pool.query(
        'SELECT id, file_path FROM classified_images WHERE classified_id = $1 AND id = ANY($2::uuid[])',
        [id, removeImageIds]
      );
      for (const row of imgResult.rows) {
        const absPath = path.join(UPLOADS_BASE, row.file_path);
        if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
      }
      await pool.query(
        'DELETE FROM classified_images WHERE classified_id = $1 AND id = ANY($2::uuid[])',
        [id, removeImageIds]
      );
    }

    const files = req.files?.images || [];
    if (files.length > 0) {
      const dir = path.join(UPLOADS_BASE, 'classifieds', id);
      fs.mkdirSync(dir, { recursive: true });
      const maxOrder = await pool.query(
        'SELECT COALESCE(MAX(sort_order), -1) as m FROM classified_images WHERE classified_id = $1',
        [id]
      );
      let nextOrder = (maxOrder.rows[0]?.m ?? -1) + 1;
      for (const file of files) {
        const ext = path.extname(file.originalname) || '.jpg';
        const filename = `${randomUUID()}${ext}`;
        const relPath = path.join('classifieds', id, filename).replace(/\\/g, '/');
        const absPath = path.join(UPLOADS_BASE, 'classifieds', id, filename);
        fs.writeFileSync(absPath, file.buffer);
        await pool.query(
          'INSERT INTO classified_images (classified_id, file_path, sort_order) VALUES ($1, $2, $3)',
          [id, relPath, nextOrder++]
        );
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
        ) as selected_cities,
        COALESCE(
          (SELECT json_agg(json_build_object('id', ci.id, 'url', '/api/uploads/' || ci.file_path) ORDER BY ci.sort_order)
           FROM classified_images ci WHERE ci.classified_id = c.id),
          '[]'::json
        ) as images
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
    const imgRows = await pool.query(
      'SELECT file_path FROM classified_images WHERE classified_id = $1',
      [id]
    );
    const result = await pool.query(
      'DELETE FROM classifieds WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Classified not found or access denied' });
    }
    const dir = path.join(UPLOADS_BASE, 'classifieds', id);
    if (fs.existsSync(dir)) {
      for (const row of imgRows.rows) {
        const absPath = path.join(UPLOADS_BASE, row.file_path);
        if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
      }
      fs.rmSync(dir, { recursive: true });
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
