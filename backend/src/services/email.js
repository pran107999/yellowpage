const { Resend } = require('resend');
const { OTP_EXPIRY_MINUTES } = require('./emailVerificationService');
const { OTP_EXPIRY_MINUTES: RESET_OTP_EXPIRY } = require('./passwordResetService');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const APP_NAME = process.env.APP_NAME || 'DesiNetwork';
// Resend: use onboarding@resend.dev until you verify a domain (same as Resend docs)
const FROM = (process.env.EMAIL_FROM || `${APP_NAME} <onboarding@resend.dev>`).trim();
// In dev, send to Resend's test inbox so you can see emails at https://resend.com/emails
const DEV_TO = process.env.NODE_ENV !== 'production' && process.env.EMAIL_DEV_TO
  ? process.env.EMAIL_DEV_TO
  : null;

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/** In dev, Resend test mode only allows sending to verified email. Don't fail registration. */
function isResendTestRestriction(error) {
  const msg = error?.message || '';
  return process.env.NODE_ENV !== 'production' && /only send testing emails to your own email/i.test(msg);
}

/**
 * Send a one-time passcode (OTP) for email verification.
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name (optional)
 * @param {string} otp - 6-digit code
 */
async function sendVerificationOtp(email, name, otp) {
  // Always log OTP in dev so you can verify without email (and when email fails)
  const logOtp = process.env.NODE_ENV !== 'production' || process.env.LOG_OTP_TO_CONSOLE === 'true';
  if (logOtp || !isConfigured()) {
    console.log('\n---------- Verification OTP (use this if email does not arrive) ----------');
    console.log('  Email:', email);
    console.log('  Code: ', otp);
    console.log(`  Expires in ${OTP_EXPIRY_MINUTES} minutes.`);
    console.log('---------------------------------------------------------------------------\n');
  }

  if (!isConfigured()) {
    return;
  }

  try {
    const to = DEV_TO ? [DEV_TO] : [email];
    if (DEV_TO) console.log('[Email] Dev mode: sending to', DEV_TO, '(actual recipient:', email, ')');
    else console.log('[Email] Sending OTP to', email);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Your verification code - ${APP_NAME}`,
      html: `
    <p>Hi ${name || 'there'},</p>
    <p>Your verification code for ${APP_NAME} is:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #f59e0b;">${otp}</p>
    <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
    ${DEV_TO ? `<p><small>Dev: intended for ${email}</small></p>` : ''}
  `,
      text: `Your ${APP_NAME} verification code is: ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    });
    if (error) {
      console.error('[Email] Resend error:', JSON.stringify(error, null, 2));
      if (isResendTestRestriction(error)) {
        console.warn('[Email] Resend test mode: emails only go to your verified address. Use the OTP printed above to verify.');
        return;
      }
      throw new Error(error.message || 'Resend request failed');
    }
    console.log('[Email] Sent successfully. Id:', data?.id || 'unknown');
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
    if (logOtp) console.log('[Email] Use the OTP printed above to verify.');
    if (isResendTestRestriction(err)) {
      console.warn('[Email] Resend test mode: use the OTP printed above to verify.');
      return;
    }
    throw err;
  }
}

/**
 * Send a password reset OTP.
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name (optional)
 * @param {string} otp - 6-digit code
 */
async function sendPasswordResetOtp(email, name, otp) {
  const logOtp = process.env.NODE_ENV !== 'production' || process.env.LOG_OTP_TO_CONSOLE === 'true';
  if (logOtp || !isConfigured()) {
    console.log('\n---------- Password reset OTP (use this if email does not arrive) ----------');
    console.log('  Email:', email);
    console.log('  Code: ', otp);
    console.log(`  Expires in ${RESET_OTP_EXPIRY} minutes.`);
    console.log('---------------------------------------------------------------------------\n');
  }

  if (!isConfigured()) return;

  try {
    const to = DEV_TO ? [DEV_TO] : [email];
    if (DEV_TO) console.log('[Email] Dev mode: sending to', DEV_TO, '(actual recipient:', email, ')');
    else console.log('[Email] Sending password reset OTP to', email);
    console.log('[Email] Using from:', FROM);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Password reset code - ${APP_NAME}`,
      html: `
    <p>Hi ${name || 'there'},</p>
    <p>Your password reset code for ${APP_NAME} is:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #f59e0b;">${otp}</p>
    <p>This code expires in ${RESET_OTP_EXPIRY} minutes. If you didn't request this, you can ignore this email.</p>
    ${DEV_TO ? `<p><small>Dev: intended for ${email}</small></p>` : ''}
  `,
      text: `Your ${APP_NAME} password reset code is: ${otp}. It expires in ${RESET_OTP_EXPIRY} minutes.`,
    });
    if (error) {
      console.error('[Email] Resend error:', JSON.stringify(error, null, 2));
      if (isResendTestRestriction(error)) {
        console.warn('[Email] Resend test mode: use the OTP printed above.');
        return;
      }
      throw new Error(error.message || 'Resend request failed');
    }
    console.log('[Email] Password reset sent. Id:', data?.id || 'unknown');
  } catch (err) {
    console.error('[Email] Password reset send failed:', err.message);
    if (logOtp) console.log('[Email] Use the OTP printed above.');
    if (isResendTestRestriction(err)) return;
    throw err;
  }
}

module.exports = { sendVerificationOtp, sendPasswordResetOtp, isConfigured };
