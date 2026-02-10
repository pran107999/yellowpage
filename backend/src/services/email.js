const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const APP_NAME = process.env.APP_NAME || 'DesiNetwork';
// Resend free tier: use onboarding@resend.dev until you verify a domain. Format: "Name <email>"
const FROM = process.env.EMAIL_FROM || `${APP_NAME} <onboarding@resend.dev>`;

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
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
    console.log('  Expires in 15 minutes.');
    console.log('---------------------------------------------------------------------------\n');
  }

  if (!isConfigured()) {
    return;
  }

  try {
    console.log('[Email] Sending OTP to', email);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [email],
      subject: `Your verification code - ${APP_NAME}`,
      html: `
    <p>Hi ${name || 'there'},</p>
    <p>Your verification code for ${APP_NAME} is:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #f59e0b;">${otp}</p>
    <p>This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
  `,
      text: `Your ${APP_NAME} verification code is: ${otp}. It expires in 15 minutes.`,
    });
    if (error) {
      console.error('[Email] Resend error:', JSON.stringify(error, null, 2));
      // In dev, Resend test mode only allows sending to your verified email. Don't fail registration.
      const isResendTestRestriction =
        process.env.NODE_ENV !== 'production' &&
        error.statusCode === 403 &&
        /only send testing emails to your own email/i.test(error.message || '');
      if (isResendTestRestriction) {
        console.warn('[Email] Resend test mode: emails only go to your verified address. Use the OTP printed above to verify.');
        return;
      }
      throw new Error(error.message || 'Resend request failed');
    }
    console.log('[Email] Sent successfully. Id:', data?.id || 'unknown');
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
    if (logOtp) console.log('[Email] Use the OTP printed above to verify.');
    // Same dev bypass if the error was thrown from our code above (e.g. after JSON parse)
    const isResendTestRestriction =
      process.env.NODE_ENV !== 'production' &&
      /only send testing emails to your own email/i.test(err.message || '');
    if (isResendTestRestriction) {
      console.warn('[Email] Resend test mode: use the OTP printed above to verify.');
      return;
    }
    throw err;
  }
}

module.exports = { sendVerificationOtp, isConfigured };
