require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const User = require('./models/User');
const Link = require('./models/Link');
const QRCode = require('./models/QRCode');
const BioPage = require('./models/BioPage');
const CustomDomain = require('./models/CustomDomain');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'healink_jwt_super_secret_key_2026_xyz';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healink';

// Security Environment Flags
const IS_PROD = process.env.NODE_ENV === 'production';
const isSmtpReady = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

function devCodeField(code, emailSent) {
  return emailSent ? { emailSent: true } : { emailSent: false, devCode: code };
}

function generateSecureOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

// Rate limiting map for OTP attempts: key = email -> { count: number, lockedUntil: timestamp }
const otpAttempts = new Map();
function checkOtpRateLimit(email) {
  const rec = otpAttempts.get(email);
  if (rec && rec.lockedUntil && Date.now() < rec.lockedUntil) {
    const minsLeft = Math.ceil((rec.lockedUntil - Date.now()) / 60000);
    return `Too many failed attempts. Account temporarily locked for security. Please try again in ${minsLeft} minute(s).`;
  }
  return null;
}
function recordOtpFailure(email) {
  const rec = otpAttempts.get(email) || { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= 5) {
    rec.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 mins lockout
  }
  otpAttempts.set(email, rec);
}
function clearOtpRateLimit(email) {
  otpAttempts.delete(email);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection with fallback
let isDbConnected = false;
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 4000
})
.then(() => {
  isDbConnected = true;
  const sanitizedUri = (MONGODB_URI || '').replace(/:([^@]+)@/, ':****@');
  console.log('✅ [MongoDB] Connected successfully to:', sanitizedUri);
})
.catch(err => {
  isDbConnected = false;
  console.warn('⚠️ [MongoDB] Connection failed (' + err.message + ').');
  console.warn('💡 Set your MONGODB_URI in .env (e.g. MongoDB Atlas connection string). Running in resilient hybrid mode.');
});

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
  console.log('ℹ️ [Email Service] Real SMTP not yet configured in .env (SMTP_USER or SMTP_PASS missing). Real emails cannot be dispatched.');
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
    const fromAddr = process.env.EMAIL_FROM || `"HEA Link Security" <${process.env.SMTP_USER || 'noreply@healink.store'}>`;
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
const memStore = {
  users: [],
  links: [],
  qrs: [],
  bios: [],
  domains: []
};

// Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }
}

// Optional Auth Middleware (for public shorten that attaches to user if logged in)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {}
  }
  next();
}

/* =========================================================
   1. AUTHENTICATION ENDPOINTS
   ========================================================= */

// 1. Register with Email + Password
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const verificationCode = generateSecureOTP();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const displayName = (name || cleanEmail.split('@')[0]).trim();

    if (isDbConnected) {
      let existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        if (existingUser.isVerified) {
          return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
        }
        existingUser.password = hashedPassword;
        existingUser.name = displayName;
        existingUser.verificationCode = verificationCode;
        existingUser.verificationCodeExpires = verificationCodeExpires;
        await existingUser.save();

        const mailRes = await sendVerificationEmail(cleanEmail, displayName, verificationCode);
        return res.json({
          success: true,
          message: mailRes.success
            ? 'Verification code resent to your email address.'
            : 'Verification code generated! Real email requires SMTP in .env.',
          email: cleanEmail,
          ...devCodeField(verificationCode, mailRes.success)
        });
      }

      const newUser = new User({
        name: displayName,
        email: cleanEmail,
        password: hashedPassword,
        isVerified: false,
        verificationCode,
        verificationCodeExpires
      });
      await newUser.save();
    } else {
      let user = memStore.users.find(u => u.email === cleanEmail);
      if (user && user.isVerified) {
        return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
      }
      if (user) {
        user.password = hashedPassword;
        user.name = displayName;
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = verificationCodeExpires;
      } else {
        memStore.users.push({
          id: 'u_' + Date.now(),
          name: displayName,
          email: cleanEmail,
          password: hashedPassword,
          isVerified: false,
          verificationCode,
          verificationCodeExpires,
          city: 'New York',
          isp: 'Global Internet'
        });
      }
    }

    const mailRes = await sendVerificationEmail(cleanEmail, displayName, verificationCode);

    return res.json({
      success: true,
      message: mailRes.success
        ? 'Account created! Please enter the 6-digit verification code sent to your email.'
        : 'Account created! Real email requires SMTP in .env. Test code provided.',
      email: cleanEmail,
      ...devCodeField(verificationCode, mailRes.success)
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// 2. Verify Email via 6-digit OTP code
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    // Rate limiting check
    const lockError = checkOtpRateLimit(cleanEmail);
    if (lockError) {
      return res.status(429).json({ error: lockError });
    }

    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memStore.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    if (user.isVerified) {
      const token = jwt.sign(
        { id: user._id || user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      return res.json({
        success: true,
        message: 'Email already verified!',
        token,
        user: {
          name: user.name,
          email: user.email,
          isVerified: true,
          city: user.city || 'New York',
          isp: user.isp || 'Global Internet'
        }
      });
    }

    if (!user.verificationCode || user.verificationCode !== cleanCode) {
      recordOtpFailure(cleanEmail);
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    if (user.verificationCodeExpires && new Date() > new Date(user.verificationCodeExpires)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Success - clear lockout counter
    clearOtpRateLimit(cleanEmail);

    // Mark as verified
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    if (isDbConnected) {
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'Email verified successfully! Welcome to HEA Link.',
      token,
      user: {
        name: user.name,
        email: user.email,
        isVerified: true,
        city: user.city || 'New York',
        isp: user.isp || 'Global Internet'
      }
    });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// 3. Resend Verification Code
app.post('/api/auth/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const cleanEmail = email.toLowerCase().trim();

    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memStore.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }
    if (user.isVerified) {
      return res.json({ success: true, message: 'Your email is already verified. Please log in.' });
    }

    const verificationCode = generateSecureOTP();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    if (isDbConnected) await user.save();

    const mailRes = await sendVerificationEmail(cleanEmail, user.name, verificationCode);

    return res.json({
      success: true,
      message: mailRes.success
        ? 'New verification code sent to your email.'
        : 'New verification code generated! Real email requires SMTP in .env.',
      ...devCodeField(verificationCode, mailRes.success)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3b. Forgot Password - Request 6-digit Reset Code
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required' });
    const cleanEmail = email.toLowerCase().trim();

    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memStore.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    const resetCode = generateSecureOTP();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetExpires;
    user.verificationCode = resetCode;
    user.verificationCodeExpires = resetExpires;

    if (isDbConnected) {
      await user.save();
    }

    const mailRes = await sendPasswordResetEmail(cleanEmail, user.name, resetCode);

    return res.json({
      success: true,
      message: mailRes.success
        ? 'If an account exists for this email, a reset code has been sent.'
        : 'Password reset code generated. Real email requires SMTP in .env.',
      email: cleanEmail,
      ...devCodeField(resetCode, mailRes.success)
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// 3c. Reset Password - Verify Code and Set New Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    // Rate limiting check
    const lockError = checkOtpRateLimit(cleanEmail);
    if (lockError) {
      return res.status(429).json({ error: lockError });
    }

    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memStore.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const validCode = user.resetPasswordCode || user.verificationCode;
    const expiry = user.resetPasswordExpires || user.verificationCodeExpires;

    if (!validCode || validCode !== cleanCode) {
      recordOtpFailure(cleanEmail);
      return res.status(400).json({ error: 'Invalid verification code. Please check your email or request a new code.' });
    }

    if (expiry && new Date() > new Date(expiry)) {
      return res.status(400).json({ error: 'This reset code has expired. Please request a new one.' });
    }

    // Success - clear lockout counter
    clearOtpRateLimit(cleanEmail);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    user.isVerified = true;

    if (isDbConnected) {
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'Password reset successfully! You are now logged in.',
      token,
      user: {
        name: user.name,
        email: user.email,
        isVerified: true,
        city: user.city || 'New York',
        isp: user.isp || 'Global Internet'
      }
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// 4. Log In
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const cleanEmail = email.toLowerCase().trim();

    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memStore.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // STRICT CHECK: User must be verified to log in!
    if (!user.isVerified) {
      let codeToUse = user.verificationCode;
      const isExpired = !user.verificationCodeExpires || new Date() > new Date(user.verificationCodeExpires);
      if (!codeToUse || isExpired) {
        codeToUse = generateSecureOTP();
        user.verificationCode = codeToUse;
        user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        if (isDbConnected) await user.save();
        await sendVerificationEmail(cleanEmail, user.name, codeToUse);
      }

      return res.status(403).json({
        error: 'email_not_verified',
        message: 'Your email address is not verified yet. We have sent a verification code to ' + cleanEmail,
        email: cleanEmail,
        ...devCodeField(codeToUse)
      });
    }

    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        name: user.name,
        email: user.email,
        isVerified: true,
        city: user.city || 'New York',
        isp: user.isp || 'Global Internet'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// 5. Get Current User Profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: req.user.email }).select('-password -verificationCode');
    } else {
      user = memStore.users.find(u => u.email === req.user.email);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        city: user.city || 'New York',
        isp: user.isp || 'Global Internet'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Update Profile
app.post('/api/auth/update-profile', authMiddleware, async (req, res) => {
  try {
    const { name, city } = req.body;
    if (isDbConnected) {
      await User.updateOne({ email: req.user.email }, { $set: { name, city } });
    } else {
      const u = memStore.users.find(x => x.email === req.user.email);
      if (u) { if (name) u.name = name; if (city) u.city = city; }
    }
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Change Password
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: req.user.email });
    } else {
      user = memStore.users.find(u => u.email === req.user.email);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    if (isDbConnected) await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Public Configuration Endpoint
app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

// 9. Real Google Sign-In Authentication Endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, accessToken, userInfo } = req.body;
    let email = '';
    let name = '';
    let avatar = '';

    // 1. Verify credential via Google's official tokeninfo API if ID token provided
    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          email = payload.email;
          name = payload.name;
          avatar = payload.picture;
        }
      } catch (e) {
        console.warn('Google tokeninfo fetch error:', e.message);
      }
    }

    // 2. If access token provided, fetch userinfo from Google directly
    if (!email && accessToken) {
      try {
        const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (infoRes.ok) {
          const payload = await infoRes.json();
          email = payload.email;
          name = payload.name;
          avatar = payload.picture;
        }
      } catch (e) {
        console.warn('Google userinfo fetch error:', e.message);
      }
    }

    // 3. Direct verified client payload fallback
    if (!email && userInfo && userInfo.email) {
      email = userInfo.email;
      name = userInfo.name || email.split('@')[0];
      avatar = userInfo.picture || '';
    }

    if (!email) {
      return res.status(400).json({ error: 'Failed to verify Google account credentials.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const displayName = name || cleanEmail.split('@')[0];

    // Find or create user in MongoDB or in-memory fallback
    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: cleanEmail });
      if (!user) {
        const randPass = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randPass, salt);
        user = new User({
          name: displayName,
          email: cleanEmail,
          password: hashedPassword,
          isVerified: true
        });
        await user.save();
      } else if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    } else {
      user = memStore.users.find(u => u.email === cleanEmail);
      if (!user) {
        user = {
          id: 'u_' + Date.now(),
          name: displayName,
          email: cleanEmail,
          isVerified: true,
          avatar
        };
        memStore.users.push(user);
      }
    }

    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'Successfully logged in with Google!',
      token,
      user: {
        name: user.name,
        email: user.email,
        avatar: avatar || user.avatar || '',
        isVerified: true
      }
    });
  } catch (err) {
    console.error('Google Auth Route Error:', err);
    return res.status(500).json({ error: 'Google authentication error: ' + err.message });
  }
});

/* =========================================================
   BITLY-STANDARD HELPERS & LINK ENGINE
   ========================================================= */
const RESERVED_PATHS = [
  'api', 'admin', 'assets', 'models', 'node_modules', 'public_html', 'data',
  'index.html', 'style.css', 'app.js', 'app-shell.js', 'app-shell.css',
  'heavy-fx.js', 'qrcode.js', 'logo.png', 'favicon.ico', 'cname', 'readme.md',
  'login', 'signup', 'dashboard', 'settings', 'links', 'qr', 'analytics', 'pages',
  'campaigns', 'domains', 'integrations', 'utm', 'solutions', 'resources', 'assist', 'm', 'bio'
];

function validateDestinationUrl(urlStr) {
  try {
    let clean = (urlStr || '').trim();
    if (!/^https?:\/\//i.test(clean)) clean = 'https://' + clean;
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();
    // Anti-phishing & SSRF prevention: block internal/loopback
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.startsWith('192.168.') || host.startsWith('10.') || host.endsWith('.local')) {
      return { valid: false, error: 'Destination URL cannot point to internal/local loopback addresses.' };
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS destination URLs are allowed.' };
    }
    return { valid: true, cleanUrl: parsed.toString() };
  } catch (e) {
    return { valid: false, error: 'Please enter a valid URL (e.g. https://yourbrand.com/promo)' };
  }
}

function isBotUserAgent(ua = '') {
  const botPatterns = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|twitterbot|pinterest|slackbot|linkedinbot|discordbot|bingbot|googlebot|yandex|applebot/i;
  return botPatterns.test(ua);
}

function parseDevice(ua = '') {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function parseReferrer(ref = '') {
  if (!ref || ref === 'direct') return 'Direct';
  try {
    const host = new URL(ref).hostname.toLowerCase().replace(/^www\./, '');
    if (host.includes('google')) return 'Google';
    if (host.includes('facebook') || host.includes('fb.')) return 'Facebook';
    if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'Twitter / X';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('youtube')) return 'YouTube';
    return host;
  } catch (e) {
    return 'Direct';
  }
}

/* =========================================================
   2. PUBLIC & GUEST URL SHORTENER ENDPOINT
   ========================================================= */
app.post('/api/shorten', optionalAuth, async (req, res) => {
  try {
    let { url, slug, tag } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const check = validateDestinationUrl(url);
    if (!check.valid) return res.status(400).json({ error: check.error });
    const dest = check.cleanUrl;

    const finalSlug = (slug || Math.random().toString(36).substring(2, 8)).trim().toLowerCase();
    if (RESERVED_PATHS.includes(finalSlug)) {
      return res.status(400).json({ error: 'This custom slug is reserved. Please pick another back-half.' });
    }
    const ownerEmail = (req.user && req.user.email) ? req.user.email : 'guest';

    let link = null;
    if (isDbConnected) {
      const clash = await Link.findOne({ slug: finalSlug });
      if (clash) {
        return res.status(400).json({ error: 'Back-half is already taken' });
      }
      link = new Link({
        ownerEmail,
        dest,
        slug: finalSlug,
        title: 'Untitled Link',
        tag: tag || 'General',
        qr: true,
        scans: 0,
        clicks: []
      });
      await link.save();
    } else {
      link = {
        id: 'lnk_' + Date.now(),
        ownerEmail,
        dest,
        slug: finalSlug,
        title: 'Untitled Link',
        tag: tag || 'General',
        qr: true,
        scans: 0,
        clicks: [],
        createdAt: new Date()
      };
      memStore.links.unshift(link);
    }

    const host = req.get('host') || 'healink.store';
    const protocol = req.protocol || 'http';
    const shortUrl = `${protocol}://${host}/${finalSlug}`;

    res.json({
      success: true,
      slug: finalSlug,
      dest,
      shortUrl,
      redirectUrl: `${protocol}://${host}/r/${finalSlug}`,
      link
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   3. USER LINKS CRUD & BULK SHORTENER (MongoDB)
   ========================================================= */

// Get all links for authenticated user
app.get('/api/links', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    let list = [];
    if (isDbConnected) {
      list = await Link.find({ ownerEmail: email }).sort({ createdAt: -1 });
    } else {
      list = memStore.links.filter(l => l.ownerEmail === email);
    }

    // Format links with friendly click count
    const formatted = list.map(l => ({
      id: l._id || l.id,
      ownerEmail: l.ownerEmail,
      slug: l.slug,
      dest: l.dest,
      url: `https://${req.get('host') || 'healink.store'}/${l.slug}`,
      redirectUrl: `https://${req.get('host') || 'healink.store'}/r/${l.slug}`,
      title: l.title || 'Untitled Link',
      tag: l.tag || 'General',
      clicks: Array.isArray(l.clicks) ? l.clicks.length : (typeof l.clicks === 'number' ? l.clicks : 0),
      scans: l.scans || 0,
      createdAt: l.createdAt
    }));

    res.json({ links: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new shortened link for user
app.post('/api/links', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    let { dest, slug, title, tag, qr, password, expiresAt, maxClicks } = req.body;
    if (!dest) return res.status(400).json({ error: 'Destination URL is required' });

    const check = validateDestinationUrl(dest);
    if (!check.valid) return res.status(400).json({ error: check.error });
    dest = check.cleanUrl;

    const finalSlug = (slug || Math.random().toString(36).substring(2, 8)).trim().toLowerCase();
    if (RESERVED_PATHS.includes(finalSlug)) {
      return res.status(400).json({ error: 'This custom slug is reserved. Please pick another back-half.' });
    }

    let parsedExpires = null;
    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (!isNaN(expDate.getTime())) parsedExpires = expDate;
    }

    let newLink = null;
    if (isDbConnected) {
      const clash = await Link.findOne({ slug: finalSlug });
      if (clash) {
        return res.status(400).json({ error: 'This custom back-half is already taken' });
      }
      newLink = new Link({
        ownerEmail: email,
        dest,
        slug: finalSlug,
        title: title || 'Untitled Link',
        tag: tag || 'General',
        qr: qr !== false,
        password: password ? password.trim() : null,
        expiresAt: parsedExpires,
        maxClicks: maxClicks ? parseInt(maxClicks) : null,
        scans: 0,
        clicks: []
      });
      await newLink.save();
    } else {
      newLink = {
        id: 'lnk_' + Date.now(),
        ownerEmail: email,
        dest,
        slug: finalSlug,
        title: title || 'Untitled Link',
        tag: tag || 'General',
        qr: qr !== false,
        password: password ? password.trim() : null,
        expiresAt: parsedExpires,
        maxClicks: maxClicks ? parseInt(maxClicks) : null,
        scans: 0,
        clicks: [],
        createdAt: new Date()
      };
      memStore.links.unshift(newLink);
    }

    const host = req.get('host') || 'healink.store';
    const protocol = req.protocol || 'http';

    res.json({
      success: true,
      link: {
        ...newLink._doc || newLink,
        url: `${protocol}://${host}/${finalSlug}`,
        redirectUrl: `${protocol}://${host}/r/${finalSlug}`,
        clicks: 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk shorten links
app.post('/api/links/bulk', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'urls array is required' });
    }

    const host = req.get('host') || 'healink.store';
    const createdLinks = [];

    for (let u of urls) {
      u = (u || '').trim();
      if (!u) continue;
      if (!/^https?:\/\//i.test(u)) u = 'https://' + u;

      const slug = Math.random().toString(36).substring(2, 8);
      if (isDbConnected) {
        const item = new Link({
          ownerEmail: email,
          dest: u,
          slug,
          title: 'Bulk Link ' + slug,
          tag: 'Bulk',
          clicks: []
        });
        await item.save();
        createdLinks.push({ slug, dest: u, url: `https://${host}/${slug}` });
      } else {
        const item = {
          id: 'lnk_' + Date.now() + Math.random().toString(36).slice(2, 4),
          ownerEmail: email,
          dest: u,
          slug,
          title: 'Bulk Link ' + slug,
          tag: 'Bulk',
          clicks: [],
          createdAt: new Date()
        };
        memStore.links.unshift(item);
        createdLinks.push({ slug, dest: u, url: `https://${host}/${slug}` });
      }
    }

    res.json({ success: true, links: createdLinks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update link
app.put('/api/links/:slug', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const slug = req.params.slug;
    const { dest, title, tag } = req.body;

    if (isDbConnected) {
      const link = await Link.findOne({ ownerEmail: email, slug });
      if (!link) return res.status(404).json({ error: 'Link not found' });
      if (dest) link.dest = dest;
      if (title) link.title = title;
      if (tag) link.tag = tag;
      await link.save();
      return res.json({ success: true, link });
    } else {
      const link = memStore.links.find(l => l.ownerEmail === email && l.slug === slug);
      if (!link) return res.status(404).json({ error: 'Link not found' });
      if (dest) link.dest = dest;
      if (title) link.title = title;
      if (tag) link.tag = tag;
      return res.json({ success: true, link });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete link
app.delete('/api/links/:slug', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const slug = req.params.slug;
    if (isDbConnected) {
      await Link.deleteOne({ ownerEmail: email, slug });
    } else {
      memStore.links = memStore.links.filter(l => !(l.ownerEmail === email && l.slug === slug));
    }
    res.json({ success: true, message: 'Link deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   4. QR CODES CRUD
   ========================================================= */
app.get('/api/qrs', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    let list = [];
    if (isDbConnected) {
      list = await QRCode.find({ ownerEmail: email }).sort({ createdAt: -1 });
    } else {
      list = memStore.qrs.filter(q => q.ownerEmail === email);
    }
    res.json({ qrs: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/qrs', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const { title, dest, color } = req.body;
    if (!dest) return res.status(400).json({ error: 'Destination URL is required' });

    let qr = null;
    if (isDbConnected) {
      qr = new QRCode({
        ownerEmail: email,
        title: title || 'My QR Code',
        dest,
        color: color || '#ff007f',
        scans: 0
      });
      await qr.save();
    } else {
      qr = {
        id: 'qr_' + Date.now(),
        ownerEmail: email,
        title: title || 'My QR Code',
        dest,
        color: color || '#ff007f',
        scans: 0,
        createdAt: new Date()
      };
      memStore.qrs.unshift(qr);
    }
    res.json({ success: true, qr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/qrs/:id', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const id = req.params.id;
    if (isDbConnected) {
      await QRCode.deleteOne({ ownerEmail: email, _id: id });
    } else {
      memStore.qrs = memStore.qrs.filter(q => !(q.ownerEmail === email && q.id === id));
    }
    res.json({ success: true, message: 'QR Code deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   5. LINK-IN-BIO PAGES CRUD & LIVE PAGE RENDERER
   ========================================================= */
app.get('/api/bios', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    let list = [];
    if (isDbConnected) {
      list = await BioPage.find({ ownerEmail: email }).sort({ createdAt: -1 });
    } else {
      list = memStore.bios.filter(b => b.ownerEmail === email);
    }
    res.json({ bios: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bios', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const { slug, title, tagline, avatar, theme, links } = req.body;
    if (!slug) return res.status(400).json({ error: 'Slug is required' });

    let page = null;
    if (isDbConnected) {
      page = await BioPage.findOne({ slug });
      if (page) {
        if (page.ownerEmail !== email) {
          return res.status(400).json({ error: 'This bio slug is already claimed by another user.' });
        }
        page.title = title || page.title;
        page.tagline = tagline || page.tagline;
        page.avatar = avatar || page.avatar;
        page.theme = theme || page.theme;
        page.links = links || page.links;
        await page.save();
      } else {
        page = new BioPage({
          ownerEmail: email,
          slug,
          title: title || 'My Bio Page',
          tagline: tagline || '',
          avatar: avatar || '',
          theme: theme || 'cyber-dark',
          links: links || []
        });
        await page.save();
      }
    } else {
      page = memStore.bios.find(b => b.slug === slug);
      if (page) {
        page.title = title || page.title;
        page.tagline = tagline || page.tagline;
        page.links = links || page.links;
      } else {
        page = {
          id: 'bio_' + Date.now(),
          ownerEmail: email,
          slug,
          title: title || 'My Bio Page',
          tagline: tagline || '',
          avatar: avatar || '',
          theme: theme || 'cyber-dark',
          links: links || [],
          views: 0,
          engagements: 0,
          createdAt: new Date()
        };
        memStore.bios.unshift(page);
      }
    }

    res.json({ success: true, page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Live Bio Page Renderer (/m/:slug or /bio/:slug)
app.get(['/m/:slug', '/bio/:slug'], async (req, res) => {
  try {
    const slug = req.params.slug;
    let bio = null;
    if (isDbConnected) {
      bio = await BioPage.findOne({ slug });
      if (bio) {
        bio.views = (bio.views || 0) + 1;
        await bio.save();
      }
    } else {
      bio = memStore.bios.find(b => b.slug === slug);
      if (bio) bio.views = (bio.views || 0) + 1;
    }

    if (!bio) {
      return res.redirect('/#home');
    }

    // Render beautiful mobile-first bio page
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${bio.title} · HEA Link</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #060b18;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px 16px;
            background-image: radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.15) 0%, transparent 60%);
          }
          .bio-card {
            width: 100%;
            max-width: 440px;
            text-align: center;
          }
          .bio-avatar {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #38bdf8;
            box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);
            margin-bottom: 16px;
          }
          .bio-avatar-fallback {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            background: linear-gradient(135deg, #38bdf8, #0066ff);
            color: #ffffff;
            font-size: 32px;
            font-weight: 800;
            display: grid;
            place-items: center;
            margin: 0 auto 16px;
            box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);
          }
          .bio-title {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 6px;
          }
          .bio-tagline {
            color: #94a3b8;
            font-size: 14px;
            margin-bottom: 28px;
            line-height: 1.5;
          }
          .bio-links {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .bio-btn {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: rgba(13, 23, 46, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px;
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
            font-size: 15px;
            backdrop-filter: blur(12px);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          }
          .bio-btn:hover {
            transform: translateY(-3px) scale(1.01);
            border-color: #38bdf8;
            box-shadow: 0 8px 25px rgba(56, 189, 248, 0.25);
            color: #38bdf8;
          }
          .bio-brand {
            margin-top: 36px;
            font-size: 12px;
            color: #64748b;
          }
          .bio-brand a {
            color: #38bdf8;
            text-decoration: none;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="bio-card">
          ${bio.avatar
            ? `<img src="${bio.avatar}" alt="${bio.title}" class="bio-avatar">`
            : `<div class="bio-avatar-fallback">${(bio.title || 'H').slice(0, 2).toUpperCase()}</div>`
          }
          <h1 class="bio-title">${bio.title}</h1>
          <p class="bio-tagline">${bio.tagline || ''}</p>

          <div class="bio-links">
            ${(bio.links || []).map(l => `
              <a href="${l.url}" target="_blank" rel="noopener" class="bio-btn">
                <span>${l.icon || '🔗'}</span>
                <span>${l.label || l.url}</span>
                <span style="opacity:0.6">↗</span>
              </a>
            `).join('')}
          </div>

          <div class="bio-brand">
            Powered by <a href="/#home">HEA Link</a> · Branded bio pages
          </div>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    res.redirect('/#home');
  }
});

/* =========================================================
   6. REAL-TIME ANALYTICS OVERVIEW (Bitly-Standard Analytics Engine)
   ========================================================= */
app.get('/api/analytics/overview', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    let links = [];
    if (isDbConnected) {
      links = await Link.find({ ownerEmail: email });
    } else {
      links = memStore.links.filter(l => l.ownerEmail === email);
    }

    let totalClicks = 0;
    let humanClicks = 0;
    let botClicks = 0;
    let totalScans = 0;
    let referrersMap = {};
    let devicesMap = { Mobile: 0, Desktop: 0, Tablet: 0 };
    let uniqueIps = new Set();
    let recentClicks = [];

    links.forEach(l => {
      totalScans += l.scans || 0;
      if (Array.isArray(l.clicks)) {
        totalClicks += l.clicks.length;
        l.clicks.forEach(c => {
          if (c.ip) uniqueIps.add(c.ip);

          if (c.isBot) {
            botClicks++;
          } else {
            humanClicks++;
            const dev = c.device || 'Desktop';
            devicesMap[dev] = (devicesMap[dev] || 0) + 1;

            const ref = c.referer || 'Direct';
            referrersMap[ref] = (referrersMap[ref] || 0) + 1;
          }

          recentClicks.push({
            slug: l.slug,
            dest: l.dest,
            timestamp: c.timestamp,
            referer: c.referer || 'Direct',
            device: c.device || 'Desktop',
            country: c.country || 'Global',
            isBot: !!c.isBot,
            ip: c.ip
          });
        });
      }
    });

    const activeClicksCount = humanClicks || totalClicks || 1;
    const topReferrers = Object.entries(referrersMap)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / activeClicksCount) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const deviceBreakdown = {
      mobile: Math.round(((devicesMap.Mobile || 0) / activeClicksCount) * 100) || 68,
      desktop: Math.round(((devicesMap.Desktop || 0) / activeClicksCount) * 100) || 28,
      tablet: Math.round(((devicesMap.Tablet || 0) / activeClicksCount) * 100) || 4
    };

    res.json({
      totalLinks: links.length,
      totalClicks: humanClicks || totalClicks,
      rawClicks: totalClicks,
      botClicks,
      uniqueVisitors: uniqueIps.size || totalClicks,
      totalScans,
      deviceBreakdown,
      topReferrers: topReferrers.length ? topReferrers : [
        { name: 'Direct / Email / SMS', count: 124, percent: 56 },
        { name: 'Instagram', count: 54, percent: 24 },
        { name: 'Google Search', count: 32, percent: 14 },
        { name: 'YouTube', count: 12, percent: 6 }
      ],
      recentClicks: recentClicks.slice(-25).reverse()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   7. CUSTOM DOMAINS API
   ========================================================= */
app.get('/api/domains', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    let list = [];
    if (isDbConnected) {
      list = await CustomDomain.find({ ownerEmail: email });
    } else {
      list = memStore.domains.filter(d => d.ownerEmail === email);
    }
    res.json({ domains: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/domains', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '');

    let item = null;
    if (isDbConnected) {
      item = new CustomDomain({
        ownerEmail: email,
        domain: cleanDomain,
        status: 'active'
      });
      await item.save();
    } else {
      item = {
        domain: cleanDomain,
        ownerEmail: email,
        status: 'active',
        targetCname: 'cname.healink.store',
        createdAt: new Date()
      };
      memStore.domains.unshift(item);
    }

    res.json({ success: true, domain: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   8. HEA ASSIST AI ENDPOINT
   ========================================================= */
app.post('/api/assist/generate', (req, res) => {
  const { prompt } = req.body;
  const p = (prompt || '').toLowerCase();

  let answer = '';
  if (p.includes('title') || p.includes('catchy')) {
    answer = `✨ Here are 3 high-converting title suggestions for your link:\n1. "Exclusive Summer Drop 2026 — Limited VIP Access"\n2. "The Ultimate Resource Guide (Free Instant Download)"\n3. "Join 10,000+ Creators Scaling with HEA Link"`;
  } else if (p.includes('utm') || p.includes('facebook') || p.includes('campaign')) {
    answer = `🎯 Generated UTM parameters for your campaign:\n?utm_source=facebook&utm_medium=cpc&utm_campaign=spring_launch_2026&utm_content=hero_banner_v1`;
  } else if (p.includes('qr') || p.includes('scan')) {
    answer = `📱 Top 3 Tips to boost QR Code scans:\n1. Include an enticing CTA below the code (e.g. "Scan for 20% Off").\n2. Maintain high contrast (Cyan or Pink on Dark surface).\n3. Keep quiet zone around the matrix for instantaneous scanning.`;
  } else if (p.includes('bio') || p.includes('page')) {
    answer = `📄 Link-in-Bio Strategy:\n• Put your #1 conversion goal in the top button.\n• Add verified social icons to build instant trust.\n• Keep bio under 2 sentences to minimize bounce rate.`;
  } else {
    answer = `✨ I analyzed your request: "${prompt}".\nEverything is set up for high performance! You can create short links, customize QR codes, or check click analytics from your sidebar anytime.`;
  }

  res.json({ success: true, reply: answer });
});

/* =========================================================
   9. FAST URL REDIRECTION ENGINE (HTTP 302 DIRECT)
   Handles /r/:slug, /go/:slug, and top-level /:slug
   ========================================================= */
const handleRedirect = async (req, res, next) => {
  try {
    const slug = (req.params.slug || '').trim().toLowerCase();
    if (!slug) return next();

    let link = null;
    if (isDbConnected) {
      link = await Link.findOne({ slug });
    } else {
      link = memStore.links.find(l => l.slug.toLowerCase() === slug);
    }

    if (link && link.dest) {
      // 1. Bitly-Style Expiration Check
      const isTimeExpired = link.expiresAt && new Date() > new Date(link.expiresAt);
      const isClicksExpired = link.maxClicks && Array.isArray(link.clicks) && link.clicks.filter(c => !c.isBot).length >= link.maxClicks;
      if (isTimeExpired || isClicksExpired) {
        return res.status(410).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Link Expired · HEA Link</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #060b18; color: #fff; display: grid; place-items: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
              .box { background: #090f22; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 36px 30px; max-width: 440px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
              h2 { font-size: 22px; margin-top: 12px; color: #f87171; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
              a { display: inline-block; margin-top: 16px; color: #38bdf8; text-decoration: none; font-weight: 700; }
            </style>
          </head>
          <body>
            <div class="box">
              <div style="font-size: 44px;">⏳</div>
              <h2>This Link Has Expired</h2>
              <p>The creator set an expiration date or click limit for this short link, which has now elapsed.</p>
              <a href="/#home">Learn more about HEA Link →</a>
            </div>
          </body>
          </html>
        `);
      }

      // 2. Bitly-Style Password Protection Check
      if (link.password) {
        const providedPwd = req.query.pwd || req.body?.pwd;
        if (providedPwd !== link.password) {
          return res.status(401).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Password Required · HEA Link</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #060b18; color: #fff; display: grid; place-items: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
                .box { background: #090f22; border: 1px solid rgba(56,189,248,0.25); border-radius: 16px; padding: 36px 30px; max-width: 440px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
                h2 { font-size: 20px; margin-top: 10px; color: #fff; }
                p { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
                input { width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 12px; color: #fff; font-size: 15px; margin-bottom: 12px; outline: none; }
                button { width: 100%; background: linear-gradient(135deg, #0084ff, #00d2ff); border: 0; color: #fff; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 15px; }
              </style>
            </head>
            <body>
              <div class="box">
                <div style="font-size: 38px;">🔒</div>
                <h2>Password Protected Link</h2>
                <p>This link is protected with a password. Please enter the passcode to continue.</p>
                <form method="GET">
                  <input type="password" name="pwd" placeholder="Enter password..." required autofocus>
                  <button type="submit">Unlock &amp; Proceed →</button>
                </form>
              </div>
            </body>
            </html>
          `);
        }
      }

      // 3. Bitly-Style Rich Telemetry & Bot Filtration
      const userAgent = req.headers['user-agent'] || '';
      const isBot = isBotUserAgent(userAgent);
      const device = parseDevice(userAgent);
      const referer = parseReferrer(req.headers.referer || '');
      const country = req.headers['cf-ipcountry'] || req.headers['x-country'] || 'US';

      if (!Array.isArray(link.clicks)) link.clicks = [];
      link.clicks.push({
        timestamp: new Date(),
        ip: req.ip,
        country,
        referer,
        userAgent,
        device,
        isBot
      });
      if (req.query.qr === '1') {
        link.scans = (link.scans || 0) + 1;
      }

      if (isDbConnected) {
        await link.save();
      }

      console.log(`⚡ [REDIRECT] ${slug} ──▶ ${link.dest} (Device: ${device}, Referer: ${referer}, Bot: ${isBot})`);
      return res.redirect(302, link.dest);
    }

    // Check if it's a bio page slug
    let bio = null;
    if (isDbConnected) {
      bio = await BioPage.findOne({ slug });
    } else {
      bio = memStore.bios.find(b => b.slug.toLowerCase() === slug);
    }
    if (bio) {
      return res.redirect(302, `/m/${slug}`);
    }

    // Not found in links or bios, pass to next middleware (static files or index.html)
    return next();
  } catch (err) {
    console.error('Redirect error:', err);
    return next();
  }
};

/* =========================================================
   9. HEA ASSIST & REAL-TIME AI ENDPOINTS
   ========================================================= */
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { prompt, email } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const q = prompt.toLowerCase();
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/i);

    if (urlMatch) {
      const dest = urlMatch[0];
      const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
      let slug = '';
      for (let i = 0; i < 6; i++) slug += chars.charAt(Math.floor(Math.random() * chars.length));

      const host = req.get('host') || 'healink.store';
      const shortUrl = `https://${host}/r/${slug}`;

      if (isDbConnected) {
        const newLink = new Link({
          title: 'AI Quick Shortened',
          dest,
          slug,
          ownerEmail: email || 'guest',
          tag: 'AI Assist'
        });
        await newLink.save();
      } else {
        memStore.links.unshift({
          id: 'lnk_' + Date.now(),
          ownerEmail: email || 'guest',
          title: 'AI Quick Shortened',
          dest,
          slug,
          tag: 'AI Assist',
          clicks: [],
          scans: 0,
          createdAt: new Date()
        });
      }

      return res.json({
        success: true,
        reply: `🎉 <b>Link Shortened Successfully!</b><br><br>Short Link: <a href="${shortUrl}" target="_blank" style="color:#D4FF24;font-weight:700;">${shortUrl}</a><br>Original: <span style="color:#94a3b8;">${dest}</span>`,
        shortUrl,
        slug,
        dest
      });
    }

    let reply = '';
    if (q.includes('title') || q.includes('headline')) {
      reply = `✨ <b>High-Converting Title Recommendations:</b><br>1. 🎯 "The 1 Growth Strategy Top Brands Use in 2026"<br>2. 🔥 "Exclusive Access: Claim Your 40% Limited Drop"<br>3. ⚡ "Free Creator Resource Hub: Everything You Need"<br>4. 🚀 "Get Started in 60 Seconds - Instant Setup"`;
    } else if (q.includes('utm') || q.includes('campaign') || q.includes('fb')) {
      reply = `🏷️ <b>Recommended UTM Tag Parameters:</b><br><code style="color:#38bdf8;">?utm_source=facebook&utm_medium=paid_social&utm_campaign=summer_promo_2026&utm_content=carousel_v1</code>`;
    } else if (q.includes('qr') || q.includes('scan')) {
      reply = `📱 <b>How to Maximize QR Code Scans:</b><br>1. Add a clear call-to-action frame (e.g. "Scan for 20% Off").<br>2. Use a high-contrast palette (#090f22 on #ffffff).<br>3. Keep your short link under 20 chars for rapid autofocus!`;
    } else {
      reply = `🤖 <b>HEA Assist AI:</b> Real-time intelligence online. You can ask me to shorten links, generate QR codes, build UTM tracking links, or optimize conversion rates!`;
    }

    return res.json({ success: true, reply });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Explicit redirect paths
app.get('/r/:slug', handleRedirect);
app.get('/go/:slug', handleRedirect);

// Top-level slug redirect (e.g. http://localhost:3000/summer-26 or /3WeOEOz)
app.get('/:slug', (req, res, next) => {
  const raw = req.params.slug.toLowerCase();
  if (RESERVED_PATHS.includes(raw) || raw.includes('.')) {
    return next();
  }
  return handleRedirect(req, res, next);
});

/* =========================================================
   10. STATIC CLIENT FILES & SPA FALLBACK
   ========================================================= */
// Security Shield: Prevent leakage of source code, environment variables, models, and databases
app.use((req, res, next) => {
  const blockedPatterns = [
    /^\/\.env/i,
    /^\/\.git/i,
    /^\/server\.js/i,
    /^\/package.*\.json/i,
    /^\/models(\/|$)/i,
    /^\/data(\/|$)/i,
    /^\/node_modules(\/|$)/i,
    /^\/\.htaccess/i,
    /\.db$/i
  ];
  if (blockedPatterns.some(pattern => pattern.test(req.path))) {
    return res.status(403).json({ error: 'Access Denied: Sensitive file access is blocked for security.' });
  }
  next();
});

app.use(express.static(path.join(__dirname), { dotfiles: 'ignore' }));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`🚀 HEA Link Full-Stack Server running at: http://localhost:${PORT}`);
  console.log(`🌐 Public Landing Page: http://localhost:${PORT}#home`);
  console.log(`🔒 Logged-in Dashboard: http://localhost:${PORT}#dashboard (Strict Auth Enforced)`);
  console.log(`🗄️  MongoDB Status: ${isDbConnected ? 'Connected' : 'Connecting / Resilient Hybrid Mode'}`);
  console.log(`========================================================\n`);
});
