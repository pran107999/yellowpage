const crypto = require('crypto');
const pool = require('../config/db');

const OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;
const OTP_REGEX = /^\d{6}$/;

function generateOtp() {
  const digits = '0123456789';
  let otp = '';
  const bytes = crypto.randomBytes(OTP_LENGTH);
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
}

function normalizeOtpCode(input) {
  const normalized = String(input || '').trim().replace(/\s/g, '');
  return normalized && OTP_REGEX.test(normalized) ? normalized : null;
}

function createOtpWithExpiry() {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  return { otp, expiresAt };
}

async function storeResetOtpForUser(userId, otp, expiresAt) {
  await pool.query(
    `UPDATE users SET password_reset_token = $1, password_reset_expires_at = $2 WHERE id = $3`,
    [otp, expiresAt, userId]
  );
}

async function findUserByResetOtp(code) {
  const result = await pool.query(
    `SELECT id, email, name, password_reset_expires_at
     FROM users WHERE password_reset_token = $1`,
    [code]
  );
  return result.rows[0] || null;
}

async function clearResetOtp(userId) {
  await pool.query(
    `UPDATE users SET password_reset_token = NULL, password_reset_expires_at = NULL WHERE id = $1`,
    [userId]
  );
}

module.exports = {
  OTP_EXPIRY_MINUTES,
  OTP_REGEX,
  createOtpWithExpiry,
  storeResetOtpForUser,
  findUserByResetOtp,
  clearResetOtp,
  normalizeOtpCode,
};
