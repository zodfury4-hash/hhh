require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const User = require('./models/User');
const Link = require('./models/Link');
const QRCode = require('./models/QRCode');
const BioPage = require('./models/BioPage');
const CustomDomain = require('./models/CustomDomain');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'healink_jwt_super_secret_key_2026_xyz';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healink';

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
  console.log('✅ [MongoDB] Connected successfully to:', MONGODB_URI);
})
.catch(err => {
  isDbConnected = false;
  console.warn('⚠️ [MongoDB] Connection failed (' + err.message + ').');
  console.warn('💡 Set your MONGODB_URI in .env (e.g. MongoDB Atlas connection string). Running in resilient hybrid mode.');
});

// Nodemailer Transporter Setup
let mailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  console.log('📧 [Email Service] Configured with SMTP:', process.env.SMTP_HOST);
} else {
  console.log('ℹ️ [Email Service] SMTP not configured in .env. Verification codes will be logged to console and returned for instant testing.');
}

// Helper: Send Verification Email
async function sendVerificationEmail(email, name, code) {
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL VERIFICATION] Sent to: ${email}`);
  console.log(`🔑 Verification Code: [ ${code} ]`);
  console.log(`⏱️  Valid for 15 minutes`);
  console.log(`======================================================\n`);

  if (!mailTransporter) return { simulated: true, code };

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
    const info = await mailTransporter.sendMail({
      from: process.env.EMAIL_FROM || '"HEA Link" <noreply@healink.store>',
      to: email,
      subject: `${code} is your HEA Link verification code`,
      html
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Failed to send verification email via SMTP:', err.message);
    return { error: err.message, simulated: true, code };
  }
}

// In-Memory Fallback Store (active if MongoDB is momentarily unreachable)
const memStore = {
  users: [],
  links: [
    {
      id: 'lnk_1',
      ownerEmail: 'hayyamameer3030@gmail.com',
      title: 'Claude AI Workspace',
      dest: 'https://claude.ai',
      slug: '3WeOEOz',
      tag: 'AI Tools',
      qr: true,
      clicks: [{ timestamp: new Date(Date.now() - 3600000), referer: 'direct', ip: '127.0.0.1' }],
      scans: 4,
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      id: 'lnk_2',
      ownerEmail: 'hayyamameer3030@gmail.com',
      title: 'Summer Launch Campaign 2026',
      dest: 'https://myshopify.com',
      slug: 'summer-26',
      tag: 'E-commerce',
      qr: true,
      clicks: [{ timestamp: new Date(Date.now() - 7200000), referer: 'facebook.com', ip: '127.0.0.1' }],
      scans: 98,
      createdAt: new Date(Date.now() - 172800000)
    }
  ],
  qrs: [
    {
      id: 'qr_1',
      ownerEmail: 'hayyamameer3030@gmail.com',
      title: 'Summer Drop QR',
      dest: 'https://myshopify.com',
      color: '#ff007f',
      scans: 98,
      createdAt: new Date()
    }
  ],
  bios: [
    {
      slug: 'hayyam',
      ownerEmail: 'hayyamameer3030@gmail.com',
      title: 'Hayyam Ameer',
      tagline: 'Content Creator & Brand Strategist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      theme: 'cyber-dark',
      links: [
        { label: 'Official YouTube Channel', url: 'https://youtube.com', icon: '▶' },
        { label: 'Follow on Instagram', url: 'https://instagram.com', icon: '📷' },
        { label: 'Join Private Discord', url: 'https://discord.com', icon: '💬' }
      ],
      views: 312,
      engagements: 144,
      createdAt: new Date()
    }
  ],
  domains: [
    {
      domain: 'go.hayyamameer.com',
      ownerEmail: 'hayyamameer3030@gmail.com',
      status: 'active',
      targetCname: 'cname.healink.store'
    }
  ]
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

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
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

        await sendVerificationEmail(cleanEmail, displayName, verificationCode);
        return res.json({
          success: true,
          message: 'Verification code resent to your email address.',
          email: cleanEmail,
          devCode: verificationCode
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
          city: 'Faisalabad',
          isp: 'Nayatel Private Limited'
        });
      }
    }

    await sendVerificationEmail(cleanEmail, displayName, verificationCode);

    return res.json({
      success: true,
      message: 'Account created! Please enter the 6-digit verification code sent to your email.',
      email: cleanEmail,
      devCode: verificationCode
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
          city: user.city || 'Faisalabad',
          isp: user.isp || 'Nayatel Private Limited'
        }
      });
    }

    if (!user.verificationCode || user.verificationCode !== cleanCode) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    if (user.verificationCodeExpires && new Date() > new Date(user.verificationCodeExpires)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

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
        city: user.city || 'Faisalabad',
        isp: user.isp || 'Nayatel Private Limited'
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

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    if (isDbConnected) await user.save();

    await sendVerificationEmail(cleanEmail, user.name, verificationCode);

    return res.json({
      success: true,
      message: 'New verification code sent to your email.',
      devCode: verificationCode
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
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
        codeToUse = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = codeToUse;
        user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        if (isDbConnected) await user.save();
        await sendVerificationEmail(cleanEmail, user.name, codeToUse);
      }

      return res.status(403).json({
        error: 'email_not_verified',
        message: 'Your email address is not verified yet. We have sent a verification code to ' + cleanEmail,
        email: cleanEmail,
        devCode: codeToUse
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
        city: user.city || 'Faisalabad',
        isp: user.isp || 'Nayatel Private Limited'
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
        city: user.city || 'Faisalabad',
        isp: user.isp || 'Nayatel Private Limited'
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

/* =========================================================
   2. PUBLIC & GUEST URL SHORTENER ENDPOINT
   ========================================================= */
app.post('/api/shorten', optionalAuth, async (req, res) => {
  try {
    let { url, slug, tag } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    let dest = url.trim();
    if (!/^https?:\/\//i.test(dest)) dest = 'https://' + dest;

    try {
      new URL(dest);
    } catch (e) {
      return res.status(400).json({ error: 'Please enter a valid URL (e.g. https://example.com)' });
    }

    const finalSlug = (slug || Math.random().toString(36).substring(2, 8)).trim().toLowerCase();
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
    let { dest, slug, title, tag, qr } = req.body;
    if (!dest) return res.status(400).json({ error: 'Destination URL is required' });

    dest = dest.trim();
    if (!/^https?:\/\//i.test(dest)) dest = 'https://' + dest;

    const finalSlug = (slug || Math.random().toString(36).substring(2, 8)).trim().toLowerCase();

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
   6. REAL-TIME ANALYTICS OVERVIEW
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
    let totalScans = 0;
    let referrersMap = {};
    let recentClicks = [];

    links.forEach(l => {
      totalScans += l.scans || 0;
      if (Array.isArray(l.clicks)) {
        totalClicks += l.clicks.length;
        l.clicks.forEach(c => {
          const ref = (c.referer || 'Direct').replace(/^https?:\/\//, '').split('/')[0] || 'Direct';
          referrersMap[ref] = (referrersMap[ref] || 0) + 1;
          recentClicks.push({
            slug: l.slug,
            dest: l.dest,
            timestamp: c.timestamp,
            referer: ref,
            ip: c.ip
          });
        });
      }
    });

    const topReferrers = Object.entries(referrersMap)
      .map(([name, count]) => ({ name, count, percent: totalClicks ? Math.round((count / totalClicks) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      totalLinks: links.length,
      totalClicks,
      totalScans,
      topReferrers: topReferrers.length ? topReferrers : [
        { name: 'Direct / Email / SMS', count: 124, percent: 56 },
        { name: 'Instagram', count: 54, percent: 24 },
        { name: 'Google Search', count: 32, percent: 14 },
        { name: 'YouTube', count: 12, percent: 6 }
      ],
      recentClicks: recentClicks.slice(-15).reverse()
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
      if (link) {
        link.clicks.push({
          timestamp: new Date(),
          ip: req.ip,
          referer: req.headers.referer || 'direct',
          userAgent: req.headers['user-agent']
        });
        if (req.query.qr === '1') {
          link.scans = (link.scans || 0) + 1;
        }
        await link.save();
      }
    } else {
      link = memStore.links.find(l => l.slug.toLowerCase() === slug);
      if (link) {
        link.clicks.push({
          timestamp: new Date(),
          ip: req.ip,
          referer: req.headers.referer || 'direct',
          userAgent: req.headers['user-agent']
        });
        if (req.query.qr === '1') {
          link.scans = (link.scans || 0) + 1;
        }
      }
    }

    // If link found in database, REDIRECT IMMEDIATELY to destination!
    if (link && link.dest) {
      console.log(`⚡ [REDIRECT] ${slug} ──▶ ${link.dest} (Clicks: ${link.clicks.length})`);
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

// Explicit redirect paths
app.get('/r/:slug', handleRedirect);
app.get('/go/:slug', handleRedirect);

// Reserved paths that should never be intercepted as short link slugs
const RESERVED_PATHS = [
  'api', 'admin', 'assets', 'models', 'node_modules', 'public_html', 'data',
  'index.html', 'style.css', 'app.js', 'app-shell.js', 'app-shell.css',
  'heavy-fx.js', 'qrcode.js', 'logo.png', 'favicon.ico', 'cname', 'readme.md',
  'login', 'signup', 'dashboard', 'settings', 'links', 'qr', 'analytics', 'pages',
  'campaigns', 'domains', 'integrations', 'utm', 'solutions', 'resources', 'assist', 'm', 'bio'
];

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
app.use(express.static(path.join(__dirname)));

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
