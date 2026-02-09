const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    const result = await pool.query(
      'SELECT id, email, name, role, email_verified_at, email_verification_token FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const row = result.rows[0];
    const emailVerified = Boolean(row.email_verified_at) || (row.email_verified_at == null && row.email_verification_token == null);
    req.user = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      emailVerified,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireVerifiedEmail = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({ error: 'Please verify your email to post or manage classifieds.' });
  }
  next();
};

module.exports = { auth, adminOnly, requireVerifiedEmail };
