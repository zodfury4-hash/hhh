const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const config = require('../config');
const memStore = require('../utils/memStore');
const socialAuth = require('../services/socialAuth');
const { isDbConnected, isMemStoreAllowed, createDbUnavailableError } = require('../middleware/dbCheck');
const { authMiddleware, optionalAuth, setAuthCookies, clearAuthCookies, JWT_SECRET } = require('../middleware/auth');
const { generateSecureOTP, hashOtp, verifyOtpHash, checkOtpRateLimit, recordOtpFailure, clearOtpRateLimit } = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail, isEmailServiceConfigured } = require('../utils/mailer');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../middleware/validation');

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
      plan: user.plan || (isAdmin ? 'Unlimited' : 'Free'),
      tokenVersion: user.tokenVersion || 0
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
    } else if (isMemStoreAllowed()) {
      existingUser = memStore.users.find((u) => u.email === cleanEmail);
    } else {
      throw createDbUnavailableError();
    }

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
      }

      if (process.env.NODE_ENV === 'production' && !isEmailServiceConfigured()) {
        if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' || isMemStoreAllowed()) {
          existingUser.isVerified = true;
          if (isDbConnected() && typeof existingUser.save === 'function') {
            await existingUser.save();
          }
          const token = generateAuthToken(existingUser);
          setAuthCookies(res, token);
          return res.json({
            success: true,
            verified: true,
            token,
            user: formatUserResponse(existingUser),
            message: 'Account updated and verified! You are now logged in.'
          });
        }
        return res.status(503).json({
          ok: false,
          code: 'EMAIL_SERVICE_UNAVAILABLE',
          error: 'Email verification service is temporarily unavailable. Please try again later.'
        });
      }

      // Unverified existing account: refresh verification code
      const verificationCode = generateSecureOTP();
      const verificationCodeHash = hashOtp(cleanEmail, verificationCode);
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      existingUser.verificationCode = process.env.NODE_ENV === 'test' ? verificationCode : null;
      existingUser.verificationCodeHash = verificationCodeHash;
      existingUser.verificationCodeExpires = verificationCodeExpires;
      existingUser.name = displayName;

      if (isDbConnected()) {
        await existingUser.save();
      }

      const mailRes = await sendVerificationEmail(cleanEmail, displayName, verificationCode);
      if (!mailRes.success && process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          ok: false,
          code: mailRes.code || 'EMAIL_SERVICE_UNAVAILABLE',
          error: 'Email verification service is temporarily unavailable. Please try again later.'
        });
      }

      return res.json({
        success: true,
        message: 'Account pending verification. A 6-digit code has been sent to your email address.',
        email: cleanEmail
      });
    }

    if (process.env.NODE_ENV === 'production' && !isEmailServiceConfigured()) {
      if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' || isMemStoreAllowed()) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        let autoUser = null;
        if (isDbConnected()) {
          autoUser = await User.create({
            name: displayName,
            email: cleanEmail,
            password: hashedPassword,
            isVerified: true,
            tokenVersion: 0,
            role: 'user',
            plan: 'Free'
          });
        } else {
          autoUser = {
            id: 'u_' + Date.now(),
            name: displayName,
            email: cleanEmail,
            password: hashedPassword,
            isVerified: true,
            tokenVersion: 0,
            role: 'user',
            plan: 'Free'
          };
          memStore.users.push(autoUser);
        }
        const token = generateAuthToken(autoUser);
        setAuthCookies(res, token);
        return res.json({
          success: true,
          verified: true,
          token,
          user: formatUserResponse(autoUser),
          message: 'Account created! You are now logged in.'
        });
      }
      return res.status(503).json({
        ok: false,
        code: 'EMAIL_SERVICE_UNAVAILABLE',
        error: 'Email verification service is temporarily unavailable. Please try again later.'
      });
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationCode = generateSecureOTP();
    const verificationCodeHash = hashOtp(cleanEmail, verificationCode);
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let newUser = null;
    if (isDbConnected()) {
      newUser = new User({
        name: displayName,
        email: cleanEmail,
        password: hashedPassword,
        isVerified: false,
        verificationCode: null,
        verificationCodeHash,
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
        verificationCode: process.env.NODE_ENV === 'test' ? verificationCode : null,
        verificationCodeHash,
        verificationCodeExpires,
        tokenVersion: 0,
        role: 'user',
        plan: 'Free'
      };
      memStore.users.push(newUser);
    }

    const mailRes = await sendVerificationEmail(cleanEmail, displayName, verificationCode);
    if (!mailRes.success && process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        ok: false,
        code: mailRes.code || 'EMAIL_SERVICE_UNAVAILABLE',
        error: 'Email verification service is temporarily unavailable. Please try again later.'
      });
    }

    return res.json({
      success: true,
      message: 'Account created! Please enter the 6-digit verification code sent to your email.',
      email: cleanEmail
    });
  } catch (err) {
    if (err.statusCode === 503) return res.status(503).json({ ok: false, error: err.message, code: err.code });
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// 2. Verify Email via 6-digit OTP code
router.post('/api/auth/verify-email', authLimiter, otpLimiter, validate(verifyEmailSchema), async (req, res) => {
  try {
    const { email, code } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const lockError = checkOtpRateLimit(cleanEmail, req.ip);
    if (lockError) {
      return res.status(429).json({ error: lockError });
    }

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: cleanEmail });
    }
    if (!user && (isMemStoreAllowed() || process.env.ALLOW_IN_MEMORY_FALLBACK === 'true')) {
      user = memStore.users.find((u) => u.email === cleanEmail);
    }
    if (!user && !isDbConnected() && !isMemStoreAllowed()) {
      throw createDbUnavailableError();
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    if (user.isVerified) {
      clearOtpRateLimit(cleanEmail, req.ip);
      const token = generateAuthToken(user);
      setAuthCookies(res, token);
      return res.json({
        success: true,
        message: 'Email is already verified!',
        token,
        user: formatUserResponse(user)
      });
    }

    const hashMatches = verifyOtpHash(cleanEmail, cleanCode, user.verificationCodeHash);
    const legacyTestMatch = process.env.NODE_ENV === 'test' && user.verificationCode && user.verificationCode === cleanCode;
    if (!hashMatches && !legacyTestMatch) {
      recordOtpFailure(cleanEmail, req.ip);
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    if (user.verificationCodeExpires && new Date() > new Date(user.verificationCodeExpires)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Success - clear lockout counter & invalidate OTP (single-use)
    clearOtpRateLimit(cleanEmail, req.ip);
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeHash = null;
    user.verificationCodeExpires = null;

    if (isDbConnected()) {
      await user.save();
    }

    const token = generateAuthToken(user);
    setAuthCookies(res, token);

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
router.post('/api/auth/resend-code', authLimiter, otpLimiter, validate(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    if (process.env.NODE_ENV === 'production' && !isEmailServiceConfigured()) {
      if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' || isMemStoreAllowed()) {
        return res.json({
          success: true,
          message: 'A new 6-digit verification code has been dispatched.',
          email: cleanEmail
        });
      }
      return res.status(503).json({
        ok: false,
        code: 'EMAIL_SERVICE_UNAVAILABLE',
        error: 'Email verification service is temporarily unavailable. Please try again later.'
      });
    }

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: cleanEmail });
    }
    if (!user && (isMemStoreAllowed() || process.env.ALLOW_IN_MEMORY_FALLBACK === 'true')) {
      user = memStore.users.find((u) => u.email === cleanEmail);
    }
    if (!user && !isDbConnected() && !isMemStoreAllowed()) {
      throw createDbUnavailableError();
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    if (user.isVerified) {
      return res.json({ success: true, message: 'Your email is already verified. Please log in.' });
    }

    const verificationCode = generateSecureOTP();
    const verificationCodeHash = hashOtp(cleanEmail, verificationCode);
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = process.env.NODE_ENV === 'test' ? verificationCode : null;
    user.verificationCodeHash = verificationCodeHash;
    user.verificationCodeExpires = verificationCodeExpires;

    if (isDbConnected()) await user.save();

    const mailRes = await sendVerificationEmail(cleanEmail, user.name, verificationCode);
    if (!mailRes.success && process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        ok: false,
        code: mailRes.code || 'EMAIL_SERVICE_UNAVAILABLE',
        error: 'Email verification service is temporarily unavailable. Please try again later.'
      });
    }

    return res.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
      email: cleanEmail
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// 4. Forgot Password - Request 6-digit Reset Code
router.post('/api/auth/forgot-password', authLimiter, otpLimiter, validate(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    if (process.env.NODE_ENV === 'production' && !isEmailServiceConfigured()) {
      if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' || isMemStoreAllowed()) {
        return res.json({
          success: true,
          message: 'If an account exists for this email, a reset code has been dispatched.',
          email: cleanEmail
        });
      }
      return res.status(503).json({
        ok: false,
        code: 'EMAIL_SERVICE_UNAVAILABLE',
        error: 'Email verification service is temporarily unavailable. Please try again later.'
      });
    }

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: cleanEmail });
    }
    if (!user && (isMemStoreAllowed() || process.env.ALLOW_IN_MEMORY_FALLBACK === 'true')) {
      user = memStore.users.find((u) => u.email === cleanEmail);
    }
    if (!user && !isDbConnected() && !isMemStoreAllowed()) {
      throw createDbUnavailableError();
    }

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists for this email, a reset code has been dispatched.',
        email: cleanEmail
      });
    }

    const resetCode = generateSecureOTP();
    const resetCodeHash = hashOtp(cleanEmail, resetCode);
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordCode = process.env.NODE_ENV === 'test' ? resetCode : null;
    user.resetPasswordCodeHash = resetCodeHash;
    user.resetPasswordExpires = resetExpires;

    if (isDbConnected()) {
      await user.save();
    }

    const mailRes = await sendPasswordResetEmail(cleanEmail, user.name, resetCode);
    if (!mailRes.success && process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        ok: false,
        code: mailRes.code || 'EMAIL_SERVICE_UNAVAILABLE',
        error: 'Email verification service is temporarily unavailable. Please try again later.'
      });
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
router.post('/api/auth/reset-password', authLimiter, otpLimiter, validate(resetPasswordSchema), async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const lockError = checkOtpRateLimit(cleanEmail, req.ip);
    if (lockError) {
      return res.status(429).json({ error: lockError });
    }

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: cleanEmail });
    }
    if (!user && (isMemStoreAllowed() || process.env.ALLOW_IN_MEMORY_FALLBACK === 'true')) {
      user = memStore.users.find((u) => u.email === cleanEmail);
    }
    if (!user && !isDbConnected() && !isMemStoreAllowed()) {
      throw createDbUnavailableError();
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const hashMatches =
      verifyOtpHash(cleanEmail, cleanCode, user.resetPasswordCodeHash) ||
      verifyOtpHash(cleanEmail, cleanCode, user.verificationCodeHash);
    const legacyTestMatch =
      process.env.NODE_ENV === 'test' &&
      ((user.resetPasswordCode && user.resetPasswordCode === cleanCode) ||
        (user.verificationCode && user.verificationCode === cleanCode));
    const expiry = user.resetPasswordExpires || user.verificationCodeExpires;

    if (!hashMatches && !legacyTestMatch) {
      recordOtpFailure(cleanEmail, req.ip);
      return res
        .status(400)
        .json({ error: 'Invalid verification code. Please check your email or request a new code.' });
    }

    if (expiry && new Date() > new Date(expiry)) {
      return res.status(400).json({ error: 'This reset code has expired. Please request a new one.' });
    }

    // Success - clear lockout counter, invalidate code, and bump tokenVersion
    clearOtpRateLimit(cleanEmail, req.ip);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordCode = null;
    user.resetPasswordCodeHash = null;
    user.resetPasswordExpires = null;
    user.verificationCode = null;
    user.verificationCodeHash = null;
    user.verificationCodeExpires = null;
    user.isVerified = true;
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    if (isDbConnected()) {
      await user.save();
    }

    const token = generateAuthToken(user);
    setAuthCookies(res, token);

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
    }
    if (!user && (isMemStoreAllowed() || process.env.ALLOW_IN_MEMORY_FALLBACK === 'true')) {
      user = memStore.users.find((u) => u.email === cleanEmail);
    }
    if (!user && !isDbConnected() && !isMemStoreAllowed()) {
      throw createDbUnavailableError();
    }

    if (!user || !user.password) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true') {
        user.isVerified = true;
      } else {
        let codeToUse = user.verificationCode;
        const isExpired = !user.verificationCodeExpires || new Date() > new Date(user.verificationCodeExpires);

        if (!codeToUse || isExpired) {
          codeToUse = generateSecureOTP();
          user.verificationCode = process.env.NODE_ENV === 'test' ? codeToUse : null;
          user.verificationCodeHash = hashOtp(cleanEmail, codeToUse);
          user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
          if (isDbConnected()) await user.save();
          await sendVerificationEmail(cleanEmail, user.name, codeToUse);
        }

        return res.status(403).json({
          error: 'email_not_verified',
          message: 'Your email address is not verified yet. We have sent a verification code to ' + cleanEmail,
          email: cleanEmail
        });
      }
    }

    const token = generateAuthToken(user);
    setAuthCookies(res, token);

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

// 6b. Log Out (invalidate server-side tokenVersion & clear HttpOnly cookies)
router.post('/api/auth/logout', optionalAuth, async (req, res) => {
  try {
    if (req.user && req.user.email) {
      const cleanEmail = req.user.email.toLowerCase().trim();
      if (isDbConnected()) {
        await User.updateOne({ email: cleanEmail }, { $inc: { tokenVersion: 1 } });
      } else if (isMemStoreAllowed()) {
        const u = memStore.users.find((x) => x.email === cleanEmail);
        if (u) u.tokenVersion = (u.tokenVersion || 0) + 1;
      }
    }
    clearAuthCookies(res);
    return res.json({ ok: true, success: true, message: 'Logged out cleanly' });
  } catch (err) {
    clearAuthCookies(res);
    return res.status(500).json({ error: 'Logout failed: ' + err.message });
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
      user = memStore.users.find((u) => u.email === email);
    }

    if (!user) {
      return res.status(404).json({ error: 'User account not found', code: 'USER_NOT_FOUND' });
    }

    const token = generateAuthToken(user);
    setAuthCookies(res, token);
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
      user = memStore.users.find((u) => u.email === req.user.email);
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
      const u = memStore.users.find((x) => x.email === req.user.email);
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
      user = memStore.users.find((u) => u.email === req.user.email);
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.password) {
      return res.status(400).json({ error: 'This account uses social sign-in. Use Forgot Password to set a password first.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    if (isDbConnected()) await user.save();
    clearAuthCookies(res);

    res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Public Configuration Endpoint
router.get('/api/config', (req, res) => {
  res.json({
    googleClientId: config.features.googleAuth ? config.google.clientId : '',
    appleClientId: config.features.appleAuth ? config.apple.clientId : '',
    appleConfigured: config.features.appleAuth,
    isDbConnected: isDbConnected(),
    features: config.features,
    configured: true
  });
});

// 12. Google Sign-In Authentication Endpoint (Supports ID Token or Access Token)
router.post('/api/auth/google', authLimiter, async (req, res) => {
  try {
    const idToken = (req.body && (req.body.credential || req.body.idToken)) || '';
    const accessToken = (req.body && req.body.accessToken) || '';
    if (!idToken && !accessToken) {
      return res.status(400).json({
        error: 'Google ID token (credential) or access token is required.',
        code: 'MISSING_CREDENTIAL'
      });
    }

    let verified = null;
    if (accessToken) {
      const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!gRes.ok) {
        return res.status(401).json({
          error: 'Invalid or expired Google access token.',
          code: 'INVALID_GOOGLE_TOKEN'
        });
      }
      const gUser = await gRes.json();
      if (!gUser.email || gUser.email_verified === false) {
        return res.status(401).json({
          error: 'Google account email is not verified.',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }
      verified = {
        sub: String(gUser.sub),
        email: String(gUser.email).toLowerCase().trim(),
        name: (gUser.name || gUser.email.split('@')[0]).trim(),
        avatar: gUser.picture || '',
        emailVerified: true
      };
    } else {
      verified = await socialAuth.verifyGoogleIdToken(idToken);
    }
    const cleanEmail = verified.email;
    const displayName = verified.name || cleanEmail.split('@')[0];

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({
        $or: [{ googleId: verified.sub }, { email: cleanEmail }]
      });

      if (!user) {
        user = new User({
          name: displayName,
          email: cleanEmail,
          password: null,
          googleId: verified.sub,
          authProviders: ['google'],
          avatar: verified.avatar || '',
          isVerified: true,
          role: 'user',
          plan: 'Free'
        });
        await user.save();
      } else {
        let changed = false;
        if (!user.googleId) {
          user.googleId = verified.sub;
          changed = true;
        }
        if (!Array.isArray(user.authProviders)) {
          user.authProviders = [];
        }
        if (!user.authProviders.includes('google')) {
          user.authProviders.push('google');
          changed = true;
        }
        if (!user.isVerified) {
          user.isVerified = true;
          changed = true;
        }
        if (!user.avatar && verified.avatar) {
          user.avatar = verified.avatar;
          changed = true;
        }
        if (changed) await user.save();
      }
    } else if (isMemStoreAllowed()) {
      user = memStore.users.find((u) => u.googleId === verified.sub || u.email === cleanEmail);
      if (!user) {
        user = {
          id: 'u_' + Date.now(),
          name: displayName,
          email: cleanEmail,
          password: null,
          googleId: verified.sub,
          authProviders: ['google'],
          isVerified: true,
          role: 'user',
          plan: 'Free',
          avatar: verified.avatar || ''
        };
        memStore.users.push(user);
      } else {
        if (!user.googleId) user.googleId = verified.sub;
        if (!Array.isArray(user.authProviders)) user.authProviders = [];
        if (!user.authProviders.includes('google')) user.authProviders.push('google');
        user.isVerified = true;
        if (!user.avatar && verified.avatar) user.avatar = verified.avatar;
      }
    } else {
      throw createDbUnavailableError();
    }

    const token = generateAuthToken(user);
    setAuthCookies(res, token);

    return res.json({
      success: true,
      message: 'Successfully logged in with Google!',
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) {
      console.error('Google Auth Route Error:', err);
    }
    return res.status(status).json({
      error: err.message || 'Google authentication failed.',
      code: err.code || 'GOOGLE_AUTH_ERROR'
    });
  }
});

// 13. Apple Sign-In Authentication Endpoint (JWKS Verification)
router.post('/api/auth/apple', authLimiter, async (req, res) => {
  try {
    const clientId = process.env.APPLE_CLIENT_ID || '';
    if (!clientId) {
      return res.status(503).json({
        error: 'Apple Sign-In is not configured on this server.',
        code: 'APPLE_NOT_CONFIGURED'
      });
    }

    const { identityToken, user: appleUser } = req.body || {};
    if (!identityToken || typeof identityToken !== 'string') {
      return res.status(400).json({
        error: 'Apple identityToken is required.',
        code: 'MISSING_CREDENTIAL'
      });
    }

    const verified = await socialAuth.verifyAppleIdentityToken(identityToken);
    const appleNameObj = appleUser && appleUser.name ? appleUser.name : null;
    const suppliedName = appleNameObj
      ? [appleNameObj.firstName, appleNameObj.lastName].filter(Boolean).join(' ').trim()
      : '';

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ appleId: verified.sub });
      if (!user && verified.email) {
        user = await User.findOne({ email: verified.email });
      }

      if (!user) {
        if (!verified.email) {
          return res.status(400).json({
            error: 'Apple identity token did not provide an email for new account creation.',
            code: 'APPLE_EMAIL_REQUIRED'
          });
        }
        const cleanEmail = verified.email;
        const displayName = suppliedName || cleanEmail.split('@')[0];
        user = new User({
          name: displayName,
          email: cleanEmail,
          password: null,
          appleId: verified.sub,
          authProviders: ['apple'],
          isVerified: true,
          role: 'user',
          plan: 'Free'
        });
        await user.save();
      } else {
        let changed = false;
        if (!user.appleId) {
          user.appleId = verified.sub;
          changed = true;
        }
        if (!Array.isArray(user.authProviders)) {
          user.authProviders = [];
        }
        if (!user.authProviders.includes('apple')) {
          user.authProviders.push('apple');
          changed = true;
        }
        if (!user.isVerified) {
          user.isVerified = true;
          changed = true;
        }
        if (suppliedName && (!user.name || user.name === 'John')) {
          user.name = suppliedName;
          changed = true;
        }
        if (changed) await user.save();
      }
    } else if (isMemStoreAllowed()) {
      user = memStore.users.find((u) => u.appleId === verified.sub);
      if (!user && verified.email) {
        user = memStore.users.find((u) => u.email === verified.email);
      }
      if (!user) {
        if (!verified.email) {
          return res.status(400).json({
            error: 'Apple identity token did not provide an email for new account creation.',
            code: 'APPLE_EMAIL_REQUIRED'
          });
        }
        const cleanEmail = verified.email;
        const displayName = suppliedName || cleanEmail.split('@')[0];
        user = {
          id: 'u_' + Date.now(),
          name: displayName,
          email: cleanEmail,
          password: null,
          appleId: verified.sub,
          authProviders: ['apple'],
          isVerified: true,
          role: 'user',
          plan: 'Free',
          avatar: ''
        };
        memStore.users.push(user);
      } else {
        if (!user.appleId) user.appleId = verified.sub;
        if (!Array.isArray(user.authProviders)) user.authProviders = [];
        if (!user.authProviders.includes('apple')) user.authProviders.push('apple');
        user.isVerified = true;
      }
    } else {
      throw createDbUnavailableError();
    }

    const token = generateAuthToken(user);
    setAuthCookies(res, token);

    return res.json({
      success: true,
      message: 'Successfully logged in with Apple!',
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) {
      console.error('Apple Auth Route Error:', err);
    }
    return res.status(status).json({
      error: err.message || 'Apple authentication failed.',
      code: err.code || 'APPLE_AUTH_ERROR'
    });
  }
});

module.exports = router;
