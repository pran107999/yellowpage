const crypto = require('crypto');
const pool = require('../config/db');

const OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;
const OTP_REGEX = /^\d{6}$/;

/**
 * Generate a 6-digit numeric OTP.
 */
function generateOtp() {
  const digits = '0123456789';
  let otp = '';
  const bytes = crypto.randomBytes(OTP_LENGTH);
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
}

/**
 * Normalize and validate an OTP code from request body.
 * @returns {string|null} Normalized 6-digit code or null if invalid
 */
function normalizeOtpCode(input) {
  const normalized = String(input || '').trim().replace(/\s/g, '');
  return normalized && OTP_REGEX.test(normalized) ? normalized : null;
}

/**
 * Create a new OTP with expiry timestamp.
 */
function createOtpWithExpiry() {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  return { otp, expiresAt };
}

/**
 * Store OTP for a user. Used during registration (insert) or resend (update).
 */
async function storeOtpForUser(userId, otp, expiresAt) {
  await pool.query(
    `UPDATE users SET email_verification_token = $1, email_verification_expires_at = $2 WHERE id = $3`,
    [otp, expiresAt, userId]
  );
}

/**
 * Look up user by OTP code. Returns user row or null.
 * Does not validate expiry or verified status.
 */
async function findUserByOtpCode(code) {
  const result = await pool.query(
    `SELECT id, email, name, email_verified_at, email_verification_expires_at
     FROM users WHERE email_verification_token = $1`,
    [code]
  );
  return result.rows[0] || null;
}

/**
 * Mark user as verified and clear OTP.
 */
async function markEmailVerified(userId) {
  const now = new Date();
  await pool.query(
    `UPDATE users SET email_verified_at = $1, email_verification_token = NULL, email_verification_expires_at = NULL
     WHERE id = $2`,
    [now, userId]
  );
  return now;
}

/**
 * Verify OTP code and mark email verified if valid.
 * @returns {{ verified: boolean, message: string, alreadyVerified?: boolean }}
 */
async function verifyOtpCode(code) {
  const normalizedCode = normalizeOtpCode(code);
  if (!normalizedCode) {
    return { verified: false, message: 'Please enter the 6-digit code from your email.' };
  }

  const user = await findUserByOtpCode(normalizedCode);
  if (!user) {
    return { verified: false, message: 'Invalid or expired code. Request a new one if needed.' };
  }

  if (user.email_verified_at) {
    return { verified: true, message: 'Email already verified', alreadyVerified: true };
  }

  const now = new Date();
  if (!user.email_verification_expires_at || user.email_verification_expires_at < now) {
    return { verified: false, message: 'This code has expired. Please request a new one.' };
  }

  await markEmailVerified(user.id);
  return { verified: true, message: 'Email verified successfully' };
}

module.exports = {
  OTP_EXPIRY_MINUTES,
  OTP_REGEX,
  generateOtp,
  normalizeOtpCode,
  createOtpWithExpiry,
  storeOtpForUser,
  findUserByOtpCode,
  markEmailVerified,
  verifyOtpCode,
};
