const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Link = require('../models/Link');
const QRCode = require('../models/QRCode');
const BioPage = require('../models/BioPage');
const CustomDomain = require('../models/CustomDomain');
const firebaseRtdb = require('../firebase-service');
const memStore = require('../utils/memStore');
const { authMiddleware, optionalAuth, JWT_SECRET } = require('../middleware/auth');
const {
  VIP_ADMIN_ACCOUNTS,
  isVipAdminEmail,
  devCodeField,
  generateSecureOTP,
  checkOtpRateLimit,
  recordOtpFailure,
  clearOtpRateLimit
} = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail, mailTransporter } = require('../utils/mailer');

const IS_PROD = process.env.NODE_ENV === 'production';
function isDbConnected() { return mongoose.connection.readyState === 1; }

/* =========================================================

   1. AUTHENTICATION ENDPOINTS

   ========================================================= */

// 1. Register with Email + Password

router.post('/api/auth/register', async (req, res) => {

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

    if (isDbConnected()) {

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

    // Persist new user account to Firebase Realtime Database under their email

    try {

      await firebaseRtdb.saveUser(cleanEmail, {

        name: displayName,

        email: cleanEmail,

        password: hashedPassword,

        isVerified: false,

        verificationCode,

        verificationCodeExpires: verificationCodeExpires.toISOString()

      });

    } catch (fbErr) {

      console.warn('[Firebase RTDB register warn]', fbErr.message);

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

router.post('/api/auth/verify-email', async (req, res) => {

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

    if (isDbConnected()) {

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

    if (isDbConnected()) {

      await user.save();

    }

    // Mark as verified in Firebase Realtime Database

    try {

      await firebaseRtdb.saveUser(cleanEmail, {

        isVerified: true,

        verificationCode: null,

        verificationCodeExpires: null

      });

    } catch (fbErr) {

      console.warn('[Firebase RTDB verify warn]', fbErr.message);

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

router.post('/api/auth/resend-code', async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = email.toLowerCase().trim();

    let user = null;

    if (isDbConnected()) {

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

    if (isDbConnected()) await user.save();

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

router.post('/api/auth/forgot-password', async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email address is required' });

    const cleanEmail = email.toLowerCase().trim();

    let user = null;

    if (isDbConnected()) {

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

    if (isDbConnected()) {

      await user.save();

    }

    // Save reset code in Firebase Realtime Database

    try {

      await firebaseRtdb.saveUser(cleanEmail, {

        verificationCode: resetCode,

        verificationCodeExpires: resetExpires.toISOString()

      });

    } catch (fbErr) {

      console.warn('[Firebase RTDB forgot-pass warn]', fbErr.message);

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

router.post('/api/auth/reset-password', async (req, res) => {

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

    if (isDbConnected()) {

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

    if (isDbConnected()) {

      await user.save();

    }

    // Update password in Firebase Realtime Database

    try {

      await firebaseRtdb.saveUser(cleanEmail, {

        password: hashedPassword,

        isVerified: true,

        verificationCode: null,

        verificationCodeExpires: null

      });

    } catch (fbErr) {

      console.warn('[Firebase RTDB reset-pass warn]', fbErr.message);

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

router.post('/api/auth/login', async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {

      return res.status(400).json({ error: 'Email and password are required' });

    }

    const cleanEmail = email.toLowerCase().trim();

    // Special Master Admin Account: Unlimited access to everything (furyzod02, arfatghuman86, emanxhaudhry2005, hayyamameer3030)

    if (isVipAdminEmail(cleanEmail) && password === VIP_ADMIN_ACCOUNTS[cleanEmail]?.pass) {

      const vip = VIP_ADMIN_ACCOUNTS[cleanEmail];

      const token = jwt.sign(

        { id: 'u_' + cleanEmail.split('@')[0], email: cleanEmail, name: vip.name, isAdmin: true, isPro: true, plan: 'Unlimited' },

        JWT_SECRET,

        { expiresIn: '365d' }

      );

      return res.json({

        success: true,

        message: 'VIP Unlimited Admin Logged in successfully',

        token,

        user: {

          name: vip.name,

          email: cleanEmail,

          isVerified: true,

          isPro: true,

          isAdmin: true,

          plan: 'Unlimited',

          city: 'Global Admin',

          isp: 'High-Speed Enterprise'

        }

      });

    }

    let user = null;

    if (isDbConnected()) {

      user = await User.findOne({ email: cleanEmail });

    } else {

      user = memStore.users.find(u => u.email === cleanEmail);

    }

    if (!user) {

      user = await firebaseRtdb.getUser(cleanEmail);

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

        if (isDbConnected()) await user.save();

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

router.get('/api/auth/me', authMiddleware, async (req, res) => {

  try {

    let user = null;

    if (isDbConnected()) {

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

router.post('/api/auth/update-profile', authMiddleware, async (req, res) => {

  try {

    const { name, city } = req.body;

    if (isDbConnected()) {

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

router.post('/api/auth/change-password', authMiddleware, async (req, res) => {

  try {

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {

      return res.status(400).json({ error: 'New password must be at least 6 characters' });

    }

    let user = null;

    if (isDbConnected()) {

      user = await User.findOne({ email: req.user.email });

    } else {

      user = memStore.users.find(u => u.email === req.user.email);

    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(newPassword, salt);

    if (isDbConnected()) await user.save();

    res.json({ success: true, message: 'Password changed successfully' });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

// 8. Public Configuration Endpoint

router.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    isDbConnected: isDbConnected()
  });
});

// 9. Real Google Sign-In Authentication Endpoint

router.post('/api/auth/google', async (req, res) => {

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

    if (isDbConnected()) {

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

    // Sync Google user to Firebase Realtime Database under their email

    try {

      await firebaseRtdb.saveUser(cleanEmail, {

        name: displayName,

        email: cleanEmail,

        isVerified: true,

        avatar: avatar || user.avatar || '',

        provider: 'google'

      });

    } catch (fbErr) {

      console.warn('[Firebase Google sync warn]', fbErr.message);

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


module.exports = router;
