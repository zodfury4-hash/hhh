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
  links: [],
  qrs: [],
  bios: []
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

/* =========================================================
   AUTHENTICATION ENDPOINTS
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
        // Resend code to unverified existing user
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
      // Memory fallback
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

/* =========================================================
   USER LINKS CRUD (MongoDB Persistence)
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
    res.json({ links: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new shortened link
app.post('/api/links', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const { dest, slug, title, tag, qr } = req.body;
    if (!dest) return res.status(400).json({ error: 'Destination URL is required' });

    const finalSlug = (slug || Math.random().toString(36).substring(2, 8)).trim();

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

    res.json({ success: true, link: newLink });
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
    res.json({ success: true, message: 'Link deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   FAST LINK REDIRECT (/r/:slug and /go/:slug)
   ========================================================= */
// Fast Link Redirect
const handleRedirect = async (req, res) => {
  try {
    const slug = req.params.slug;
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
        await link.save();
      }
    } else {
      link = memStore.links.find(l => l.slug === slug);
      if (link) {
        link.clicks.push({ timestamp: new Date(), ip: req.ip });
      }
    }

    if (link && link.dest) {
      return res.redirect(link.dest);
    }
    return res.redirect('/#home');
  } catch (err) {
    return res.redirect('/#home');
  }
};

app.get('/r/:slug', handleRedirect);
app.get('/go/:slug', handleRedirect);

/* =========================================================
   STATIC CLIENT FILES
   ========================================================= */
app.use(express.static(path.join(__dirname)));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 HEA Link Full-Stack Server running at: http://localhost:${PORT}`);
  console.log(`🌐 Public Landing Page: http://localhost:${PORT}#home`);
  console.log(`🔒 Logged-in Dashboard: http://localhost:${PORT}#dashboard (Strict Auth Enforced)`);
  console.log(`🗄️  MongoDB Status: ${isDbConnected ? 'Connected' : 'Connecting / Hybrid Fallback Active'}\n`);
});
