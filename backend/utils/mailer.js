const nodemailer = require('nodemailer');

const isSmtpReady = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
// Nodemailer Transporter Setup

let mailTransporter = null;

if (isSmtpReady) {
  const cleanPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if ((process.env.SMTP_HOST || '').includes('gmail')) {
    mailTransporter = nodemailer.createTransport({
      service: 'gmail',

      auth: {
        user: process.env.SMTP_USER,

        pass: cleanPass
      }
    });
  } else {
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,

      port: parseInt(process.env.SMTP_PORT || '587'),

      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',

      auth: {
        user: process.env.SMTP_USER,

        pass: cleanPass
      }
    });
  }

  console.log('📧 [Email Service] Real SMTP Configured:', process.env.SMTP_HOST, 'Account:', process.env.SMTP_USER);
} else {
  console.log(
    'ℹ️ [Email Service] Real SMTP not yet configured in .env (SMTP_USER or SMTP_PASS missing). Real emails cannot be dispatched.'
  );
}

// Helper: Send Verification Email

async function sendVerificationEmail(email, name, code) {
  console.log(`\n======================================================`);

  console.log(`📧 [EMAIL VERIFICATION] Target: ${email}`);

  console.log(`🔑 Verification Code: [ ${code} ]`);

  console.log(`⏱️  Valid for 15 minutes`);

  console.log(`======================================================\n`);

  if (!mailTransporter) {
    return { success: false, simulated: true, code, reason: 'SMTP credentials missing in .env' };
  }

  const html = `

    <!DOCTYPE html>

    <html>

    <head>

      <meta charset="utf-8">

      <style>

        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060b18; color: #f8fafc; margin: 0; padding: 40px 20px; }

        .box { max-width: 520px; margin: 0 auto; background: #090f22; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 16px; padding: 36px 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }

        .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 24px; text-align: center; }

        .logo span { color: #D4FF24; }

        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; text-align: center; }

        p { color: #94a3b8; font-size: 15px; line-height: 1.6; }

        .code-box { background: rgba(56, 189, 248, 0.08); border: 2px dashed #38bdf8; border-radius: 12px; padding: 18px; text-align: center; margin: 28px 0; }

        .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace; }

        .meta { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }

      </style>

    </head>

    <body>

      <div class="box">

        <div class="logo">HEA <span>Link</span></div>

        <h1>Verify your email address</h1>

        <p>Hi ${name || 'there'},</p>

        <p>Thank you for signing up for HEA Link. Please use the verification code below to verify your email and activate your account dashboard:</p>

        <div class="code-box">

          <div class="code">${code}</div>

        </div>

        <p style="text-align: center; font-size: 13px;">This code will expire in <b>15 minutes</b>. If you did not create this account, you can safely ignore this email.</p>

        <div class="meta">

          © 2026 HEA Link Inc. All rights reserved.<br>

          Next-generation URL shortener, QR code studio, and bio pages.

        </div>

      </div>

    </body>

    </html>

  `;

  try {
    const fromAddr = process.env.EMAIL_FROM || `"HEA Link" <${process.env.SMTP_USER || 'noreply@healink.store'}>`;

    const info = await mailTransporter.sendMail({
      from: fromAddr,

      to: email,

      subject: `${code} is your HEA Link verification code`,

      html
    });

    console.log(`✅ [Email Service] Real email dispatched to ${email}! MessageId: ${info.messageId}`);

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Failed to send verification email via SMTP:', err.message);

    return { success: false, error: err.message, simulated: true, code };
  }
}

async function sendPasswordResetEmail(email, name, code) {
  console.log(`\n======================================================`);

  console.log(`🔑 [PASSWORD RESET] Target: ${email}`);

  console.log(`🔑 Reset Code: [ ${code} ]`);

  console.log(`⏱️  Valid for 15 minutes`);

  console.log(`======================================================\n`);

  if (!mailTransporter) {
    return { success: false, simulated: true, code, reason: 'SMTP credentials missing in .env' };
  }

  const html = `

    <!DOCTYPE html>

    <html>

    <head>

      <meta charset="utf-8">

      <style>

        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060b18; color: #f8fafc; margin: 0; padding: 40px 20px; }

        .box { max-width: 520px; margin: 0 auto; background: #090f22; border: 1px solid rgba(212, 255, 36, 0.3); border-radius: 16px; padding: 36px 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }

        .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 24px; text-align: center; }

        .logo span { color: #D4FF24; }

        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; text-align: center; }

        p { color: #94a3b8; font-size: 15px; line-height: 1.6; }

        .code-box { background: rgba(212, 255, 36, 0.08); border: 2px dashed #D4FF24; border-radius: 12px; padding: 18px; text-align: center; margin: 28px 0; }

        .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #D4FF24; font-family: monospace; }

        .meta { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }

      </style>

    </head>

    <body>

      <div class="box">

        <div class="logo">HEA <span>Link</span></div>

        <h1>Reset your password</h1>

        <p>Hi ${name || 'there'},</p>

        <p>We received a request to reset the password for your HEA Link account. Use this 6-digit verification code to choose a new password:</p>

        <div class="code-box">

          <div class="code">${code}</div>

        </div>

        <p>This code will expire in 15 minutes. If you did not make this request, your account is safe and you can ignore this message.</p>

        <div class="meta">

          HEA Link Security System · Global

        </div>

      </div>

    </body>

    </html>

  `;

  try {
    const fromAddr =
      process.env.EMAIL_FROM || `"HEA Link Security" <${process.env.SMTP_USER || 'noreply@healink.store'}>`;

    const info = await mailTransporter.sendMail({
      from: fromAddr,

      to: email,

      subject: `${code} is your HEA Link password reset code`,

      html
    });

    console.log(`✅ [Email Service] Real reset email dispatched to ${email}! MessageId: ${info.messageId}`);

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Failed to send reset email via SMTP:', err.message);

    return { success: false, error: err.message, simulated: true, code };
  }
}

// In-Memory Fallback Store (active if MongoDB is momentarily unreachable)

module.exports = {
  mailTransporter,
  sendVerificationEmail,
  sendPasswordResetEmail
};
