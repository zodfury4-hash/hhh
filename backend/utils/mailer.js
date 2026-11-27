const nodemailer = require('nodemailer');

const emailProvider = (process.env.EMAIL_PROVIDER || '').toLowerCase().trim();
const emailApiKey = (process.env.EMAIL_API_KEY || '').trim();
const isHttpApiReady = Boolean((emailProvider === 'resend' || emailProvider === 'brevo') && emailApiKey);
const isSmtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

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
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: cleanPass
      }
    });
  }
  console.log('📧 [Email Service] SMTP configured:', process.env.SMTP_HOST, 'Account:', process.env.SMTP_USER);
} else if (isHttpApiReady) {
  console.log(`📧 [Email Service] HTTP email provider configured: ${emailProvider}`);
} else {
  console.log('ℹ️ [Email Service] Email transport not configured (SMTP_USER/SMTP_PASS or EMAIL_PROVIDER/EMAIL_API_KEY missing).');
}

function isEmailServiceConfigured() {
  return Boolean(mailTransporter || isHttpApiReady);
}

async function verifyMailTransport() {
  if (isHttpApiReady) {
    return { ok: true, provider: emailProvider };
  }
  if (!mailTransporter) {
    return { ok: false, code: 'MAIL_NOT_CONFIGURED', reason: 'No SMTP or HTTP email provider configured' };
  }
  try {
    await mailTransporter.verify();
    return { ok: true, provider: 'smtp' };
  } catch (err) {
    return { ok: false, code: 'MAIL_VERIFY_FAILED', error: err.message };
  }
}

async function sendViaHttpApi({ from, to, subject, html, text }) {
  if (emailProvider === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${emailApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to: [to], subject, html, text })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.message || `Resend API error (${res.status})`);
    }
    return { messageId: body.id || 'resend-ok' };
  }

  if (emailProvider === 'brevo') {
    const emailMatch = from.match(/<([^>]+)>/);
    const senderEmail = emailMatch ? emailMatch[1] : from;
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': emailApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: 'HEA Link' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text
      })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.message || `Brevo API error (${res.status})`);
    }
    return { messageId: body.messageId || 'brevo-ok' };
  }

  throw new Error(`Unsupported EMAIL_PROVIDER: ${emailProvider}`);
}

async function dispatchEmail({ from, to, subject, html, text }) {
  if (!isEmailServiceConfigured()) {
    return {
      success: false,
      simulated: true,
      code: 'MAIL_NOT_CONFIGURED',
      reason: 'Email transport credentials missing in environment'
    };
  }

  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const info = isHttpApiReady
        ? await sendViaHttpApi({ from, to, subject, html, text })
        : await mailTransporter.sendMail({ from, to, subject, html, text });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      lastErr = err;
    }
  }

  return {
    success: false,
    simulated: false,
    code: 'MAIL_DELIVERY_FAILED',
    error: lastErr ? lastErr.message : 'Unknown mail error'
  };
}

function escapeHtml(val) {
  return String(val || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendVerificationEmail(email, name, code) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(`📧 [EMAIL VERIFICATION] Target: ${email}`);
    console.log(`🔑 Verification Code: [ ${code} ]`);
    console.log(`⏱️  Valid for 10 minutes`);
    console.log(`======================================================\n`);
  }

  const from = process.env.EMAIL_FROM || `"HEA Link" <${process.env.SMTP_USER || 'noreply@healink.store'}>`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#060b18;color:#f8fafc;margin:0;padding:40px 20px;">
      <div style="max-width:520px;margin:0 auto;background:#090f22;border:1px solid rgba(56,189,248,0.2);border-radius:16px;padding:36px 30px;">
        <div style="font-size:24px;font-weight:800;color:#fff;margin-bottom:24px;text-align:center;">HEA <span style="color:#D4FF24;">Link</span></div>
        <h1 style="font-size:22px;font-weight:700;color:#fff;margin-top:0;text-align:center;">Verify your email address</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.6;">Hi ${escapeHtml(name || 'there')},</p>
        <p style="color:#94a3b8;font-size:15px;line-height:1.6;">Use this 6-digit verification code to verify your email and activate your HEA Link account:</p>
        <div style="background:rgba(56,189,248,0.08);border:2px dashed #38bdf8;border-radius:12px;padding:18px;text-align:center;margin:28px 0;">
          <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#38bdf8;font-family:monospace;">${escapeHtml(code)}</div>
        </div>
        <p style="text-align:center;font-size:13px;color:#94a3b8;">This code expires in <b>10 minutes</b>.</p>
      </div>
    </body>
    </html>`;

  const result = await dispatchEmail({
    from,
    to: email,
    subject: `${code} is your HEA Link verification code`,
    html,
    text: `Your HEA Link verification code is: ${code} (expires in 10 minutes).`
  });

  if (!result.success && result.code !== 'MAIL_NOT_CONFIGURED') {
    console.error('❌ Failed to send verification email:', result.error);
  }
  return result;
}

async function sendPasswordResetEmail(email, name, code) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(`🔑 [PASSWORD RESET] Target: ${email}`);
    console.log(`🔑 Reset Code: [ ${code} ]`);
    console.log(`⏱️  Valid for 10 minutes`);
    console.log(`======================================================\n`);
  }

  const from = process.env.EMAIL_FROM || `"HEA Link Security" <${process.env.SMTP_USER || 'noreply@healink.store'}>`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#060b18;color:#f8fafc;margin:0;padding:40px 20px;">
      <div style="max-width:520px;margin:0 auto;background:#090f22;border:1px solid rgba(212,255,36,0.3);border-radius:16px;padding:36px 30px;">
        <div style="font-size:24px;font-weight:800;color:#fff;margin-bottom:24px;text-align:center;">HEA <span style="color:#D4FF24;">Link</span></div>
        <h1 style="font-size:22px;font-weight:700;color:#fff;margin-top:0;text-align:center;">Reset your password</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.6;">Hi ${escapeHtml(name || 'there')},</p>
        <p style="color:#94a3b8;font-size:15px;line-height:1.6;">Use this 6-digit verification code to choose a new password:</p>
        <div style="background:rgba(212,255,36,0.08);border:2px dashed #D4FF24;border-radius:12px;padding:18px;text-align:center;margin:28px 0;">
          <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#D4FF24;font-family:monospace;">${escapeHtml(code)}</div>
        </div>
        <p style="text-align:center;font-size:13px;color:#94a3b8;">This code expires in <b>10 minutes</b>.</p>
      </div>
    </body>
    </html>`;

  const result = await dispatchEmail({
    from,
    to: email,
    subject: `${code} is your HEA Link password reset code`,
    html,
    text: `Your HEA Link password reset code is: ${code} (expires in 10 minutes).`
  });

  if (!result.success && result.code !== 'MAIL_NOT_CONFIGURED') {
    console.error('❌ Failed to send reset email:', result.error);
  }
  return result;
}

async function sendSupportTicketConfirmation(email, name, ticketId, subject) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📧 [SUPPORT TICKET] Target: ${email} | Ticket: ${ticketId} | Subject: ${subject}`);
  }
  const from = process.env.EMAIL_FROM || `"HEA Link Support" <${process.env.SMTP_USER || 'support@healink.store'}>`;
  const html = `<p>Hi ${escapeHtml(name || 'there')},</p><p>Support ticket <strong>${escapeHtml(ticketId)}</strong> received for: ${escapeHtml(subject)}.</p>`;
  const result = await dispatchEmail({
    from,
    to: email,
    subject: `[${ticketId}] Support Request Received: ${subject}`,
    html,
    text: `Support ticket ${ticketId} received for: ${subject}`
  });
  return { ...result, ticketId };
}

async function sendWorkspaceInviteEmail(email, workspaceName, role, acceptUrl) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`✉️ [WORKSPACE INVITE] To: ${email} | Workspace: ${workspaceName} | Role: ${role}`);
  }
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@healink.store';
  const result = await dispatchEmail({
    from,
    to: email,
    subject: `Invitation to collaborate in ${workspaceName} on HEA Link`,
    text: `You have been invited to join ${workspaceName} as ${role}. Accept: ${acceptUrl}`,
    html: `<p>You have been invited to join <strong>${escapeHtml(workspaceName)}</strong> as <strong>${escapeHtml(role.toUpperCase())}</strong>.</p><p><a href="${escapeHtml(acceptUrl)}">Accept Invitation</a></p>`
  });
  return result.success || result.simulated;
}

module.exports = {
  mailTransporter,
  isEmailServiceConfigured,
  verifyMailTransport,
  dispatchEmail,
  sendMail: (opts) => dispatchEmail(opts),
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSupportTicketConfirmation,
  sendWorkspaceInviteEmail
};
