const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { sendVerificationOtp } = require('../services/email');
const {
  createOtpWithExpiry,
  storeOtpForUser,
  verifyOtpCode,
} = require('../services/emailVerificationService');

/** Verified if they have verified_at set, or are legacy users (no token, never had OTP flow). */
function isEmailVerified(row) {
  return Boolean(row.email_verified_at) || (row.email_verified_at == null && row.email_verification_token == null);
}

function userToResponse(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    emailVerified: isEmailVerified(row),
  };
}

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password, name } = req.body;

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const { otp, expiresAt } = createOtpWithExpiry();
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, email_verification_token, email_verification_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, role, email_verified_at`,
      [email, passwordHash, name, 'user', otp, expiresAt]
    );

    const user = result.rows[0];

    try {
      await sendVerificationOtp(email, name, otp);
    } catch (emailErr) {
      console.error('Verification OTP email failed:', emailErr);
      // Still allow registration; user can resend from UI
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: userToResponse(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT id, email, name, role, password_hash, email_verified_at, email_verification_token FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: userToResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const me = async (req, res) => {
  res.json({ user: req.user });
};

/** Verify email with one-time passcode (body: { code }) */
const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const result = await verifyOtpCode(code);

    if (!result.verified) {
      return res.status(400).json({ error: result.message });
    }

    res.json({ message: result.message, emailVerified: true });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

const resendVerification = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, email, name, email_verified_at FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    if (user.email_verified_at) {
      return res.json({ message: 'Email already verified', emailVerified: true });
    }

    const { otp, expiresAt } = createOtpWithExpiry();
    await storeOtpForUser(userId, otp, expiresAt);

    try {
      await sendVerificationOtp(user.email, user.name, otp);
    } catch (emailErr) {
      console.error('Resend verification OTP failed:', emailErr);
      return res.status(500).json({ error: 'Failed to send verification email. Try again later.' });
    }

    res.json({ message: 'Verification code sent. Check your inbox.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Request failed' });
  }
};

module.exports = { register, login, me, verifyEmail, resendVerification };
