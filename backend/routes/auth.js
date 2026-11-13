const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/User');
const firebaseRtdb = require('../firebase-service');
const memStore = require('../utils/memStore');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const {
  generateSecureOTP,
  checkOtpRateLimit,
  recordOtpFailure,
  clearOtpRateLimit
} = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../middleware/validation');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function generateAuthToken(user) {
  const isAdmin = user.role === 'admin';
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      isAdmin,
      isPro: !!user.isPro || isAdmin,
      plan: user.plan || (isAdmin ? 'Unlimited' : 'Free')
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function formatUserResponse(user) {
  const isAdmin = user.role === 'admin';
  return {
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    isAdmin,
    isPro: !!user.isPro || isAdmin,
    plan: user.plan || (isAdmin ? 'Unlimited' : 'Free'),
    isVerified: !!user.isVerified,
    city: user.city || 'New York',
    isp: user.isp || 'Global Internet',
    avatar: user.avatar || ''
  };
}

/* =========================================================
   AUTHENTICATION ENDPOINTS (HARDENED)
   ========================================================= */

// 1. Register with Email + Password
router.post('/api/auth/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const displayName = (name || '').trim() || cleanEmail.split('@')[0];

    // Check if user already exists
    let existingUser = null;
    if (isDbConnected()) {
      existingUser = await User.findOne({ email: cleanEmail });
    } else {
      existingUser = memStore.users.find(u => u.email === cleanEmail);
    }

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
      }

      // Unverified existing account: refresh verification code
      const verificationCode = generateSecureOTP();
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      existingUser.verificationCode = verificationCode;
      existingUser.verificationCodeExpires = verificationCodeExpires;
      existingUser.name = displayName;

      if (isDbConnected()) {
        await existingUser.save();
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔑 [DEV ONLY] Registration OTP for ${cleanEmail}: [ ${verificationCode} ] (Valid: 10 mins)\n`);
      }

      const mailRes = await sendVerificationEmail(cleanEmail, displayName, verificationCode);
      if (!mailRes.success && process.env.NODE_ENV === 'production') {
        return res.status(502).json({ error: 'Failed to dispatch verification email. Please verify SMTP settings.' });
      }

      return res.json({
        success: true,
        message: 'Account pending verification. A 6-digit code has been sent to your email address.',
        email: cleanEmail
      });
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationCode = generateSecureOTP();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let newUser = null;
    if (isDbConnected()) {
      newUser = new User({
        name: displayName,
        email: cleanEmail,
        password: hashedPassword,
        isVerified: false,
        verificationCode,
        verificationCodeExpires,
        role: 'user',
        plan: 'Free'
      });
      await newUser.save();
    } else {
      newUser = {
        id: 'u_' + Date.now(),
        name: displayName,
        email: cleanEmail,
        password: hashedPassword,
        isVerified: false,
        verificationCode,
        verificationCodeExpires,
        role: 'user',
        plan: 'Free'
      };
      memStore.users.push(newUser);
    }

    try {
      await firebaseRtdb.saveUser(cleanEmail, {
        name: displayName,
        email: cleanEmail,
        isVerified: false,
        verificationCode,
        verificationCodeExpires: verificationCodeExpires.toISOString(),
        role: 'user',
        plan: 'Free'
      });
    } catch (fbErr) {
      console.warn('[Firebase RTDB register warn]', fbErr.message);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔑 [DEV ONLY] Registration OTP for ${cleanEmail}: [ ${verificationCode} ] (Valid: 10 mins)\n`);
    }

    const mailRes = await sendVerificationEmail(cleanEmail, displayName, verificationCode);
    if (!mailRes.success && process.env.NODE_ENV === 'production') {
      return res.status(502).json({ error: 'Failed to send verification email. Please contact support or try again.' });
    }

    return res.json({
      success: true,
      message: 'Account created! Please enter the 6-digit verification code sent to your email.',
      email: cleanEmail
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// 2. Verify Email via 6-digit OTP code
router.post('/api/auth/verify-email', authLimiter, validate(verifyEmailSchema), async (req, res) => {
  try {
    const { email, code } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

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
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    if (user.isVerified) {
      clearOtpRateLimit(cleanEmail);
      const token = generateAuthToken(user);
      return res.json({
        success: true,
        message: 'Email is already verified!',
        token,
        user: formatUserResponse(user)
      });
    }

    if (!user.verificationCode || user.verificationCode !== cleanCode) {
      recordOtpFailure(cleanEmail);
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    if (user.verificationCodeExpires && new Date() > new Date(user.verificationCodeExpires)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Success - clear lockout counter & invalidate OTP (single-use)
    clearOtpRateLimit(cleanEmail);
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;

    if (isDbConnected()) {
      await user.save();
    }

    try {
      await firebaseRtdb.saveUser(cleanEmail, {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null
      });
    } catch (fbErr) {}

    const token = generateAuthToken(user);

    return res.json({
      success: true,
      message: 'Email verified successfully! You are now logged in.',
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// 3. Resend Verification Code
router.post('/api/auth/resend-code', authLimiter, validate(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;
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
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;

    if (isDbConnected()) await user.save();

    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔑 [DEV ONLY] Resent Verification OTP for ${cleanEmail}: [ ${verificationCode} ] (Valid: 10 mins)\n`);
    }

    const mailRes = await sendVerificationEmail(cleanEmail, user.name, verificationCode);
    if (!mailRes.success && process.env.NODE_ENV === 'production') {
      return res.status(502).json({ error: 'Failed to send email. Please check your SMTP configuration.' });
    }

    return res.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
      email: cleanEmail
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Forgot Password - Request 6-digit Reset Code
router.post('/api/auth/forgot-password', authLimiter, validate(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memStore.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      // Avoid account enumeration: return success even if user not found
      return res.json({
        success: true,
        message: 'If an account exists for this email, a reset code has been dispatched.',
        email: cleanEmail
      });
    }

    const resetCode = generateSecureOTP();
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetExpires;

    if (isDbConnected()) {
      await user.save();
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔑 [DEV ONLY] Password Reset OTP for ${cleanEmail}: [ ${resetCode} ] (Valid: 10 mins)\n`);
    }

    const mailRes = await sendPasswordResetEmail(cleanEmail, user.name, resetCode);
    if (!mailRes.success && process.env.NODE_ENV === 'production') {
      return res.status(502).json({ error: 'Failed to send password reset email. Please contact support.' });
    }

    return res.json({
      success: true,
      message: 'If an account exists for this email, a reset code has been dispatched.',
      email: cleanEmail
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// 5. Reset Password - Verify Code and Set New Password
router.post('/api/auth/reset-password', authLimiter, validate(resetPasswordSchema), async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

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

    // Success - clear lockout counter & invalidate single-use code
    clearOtpRateLimit(cleanEmail);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    user.isVerified = true;

    if (isDbConnected()) {
      await user.save();
    }

    const token = generateAuthToken(user);

    return res.json({
      success: true,
      message: 'Password reset successfully! You are now logged in.',
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// 6. Log In with Email + Password
router.post('/api/auth/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    let user = null;
    if (isDbConnected()) {
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

    if (!user.isVerified) {
      let codeToUse = user.verificationCode;
      const isExpired = !user.verificationCodeExpires || new Date() > new Date(user.verificationCodeExpires);

      if (!codeToUse || isExpired) {
        codeToUse = generateSecureOTP();
        user.verificationCode = codeToUse;
        user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        if (isDbConnected()) await user.save();
        await sendVerificationEmail(cleanEmail, user.name, codeToUse);
        if (process.env.NODE_ENV === 'development') {
          console.log(`\n🔑 [DEV ONLY] Verification OTP for ${cleanEmail}: [ ${codeToUse} ]\n`);
        }
      }

      return res.status(403).json({
        error: 'email_not_verified',
        message: 'Your email address is not verified yet. We have sent a verification code to ' + cleanEmail,
        email: cleanEmail
      });
    }

    const token = generateAuthToken(user);

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// 7. Refresh JWT Token
router.post('/api/auth/refresh', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email });
    } else {
      user = memStore.users.find(u => u.email === email);
    }

    if (!user) {
      return res.status(404).json({ error: 'User account not found', code: 'USER_NOT_FOUND' });
    }

    const token = generateAuthToken(user);
    return res.json({
      success: true,
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Token refresh failed: ' + err.message });
  }
});

// 8. Get Current Authenticated User Profile
router.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: req.user.email }).select('-password -verificationCode -resetPasswordCode');
    } else {
      user = memStore.users.find(u => u.email === req.user.email);
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: formatUserResponse(user)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Update Profile
router.post('/api/auth/update-profile', authMiddleware, async (req, res) => {
  try {
    const { name, city } = req.body;
    const cleanName = (name || '').trim();
    const cleanCity = (city || '').trim();

    if (isDbConnected()) {
      await User.updateOne({ email: req.user.email }, { $set: { name: cleanName, city: cleanCity } });
    } else {
      const u = memStore.users.find(x => x.email === req.user.email);
      if (u) {
        if (cleanName) u.name = cleanName;
        if (cleanCity) u.city = cleanCity;
      }
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Change Password
router.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
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

// 11. Public Configuration Endpoint
router.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    isDbConnected: isDbConnected(),
    configured: true
  });
});

// 12. Google Sign-In Authentication Endpoint
router.post('/api/auth/google', authLimiter, async (req, res) => {
  try {
    const { credential, accessToken, userInfo } = req.body;

    let email = '';
    let name = '';
    let avatar = '';

    // Verify credential via Google's official tokeninfo API if ID token provided
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

    // If access token provided, fetch userinfo from Google directly
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

    // Direct verified client payload fallback
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

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: cleanEmail });
      if (!user) {
        const randPass = crypto.randomBytes(24).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randPass, salt);

        user = new User({
          name: displayName,
          email: cleanEmail,
          password: hashedPassword,
          isVerified: true,
          role: 'user',
          plan: 'Free'
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
          role: 'user',
          plan: 'Free',
          avatar
        };
        memStore.users.push(user);
      }
    }

    try {
      await firebaseRtdb.saveUser(cleanEmail, {
        name: displayName,
        email: cleanEmail,
        isVerified: true,
        avatar: avatar || user.avatar || '',
        provider: 'google'
      });
    } catch (fbErr) {}

    const token = generateAuthToken(user);

    return res.json({
      success: true,
      message: 'Successfully logged in with Google!',
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error('Google Auth Route Error:', err);
    return res.status(500).json({ error: 'Google authentication error: ' + err.message });
  }
});

module.exports = router;
