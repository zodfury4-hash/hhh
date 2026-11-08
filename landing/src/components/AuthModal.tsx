import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
}

export function AuthModal({ isOpen, initialMode = 'login', onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setSuccessMsg('');
  }, [initialMode, isOpen]);

  // Lock background page scroll (both native body and Lenis smooth scroll) when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const lenis = (window as any).lenis;
    if (lenis && typeof lenis.stop === 'function') {
      lenis.stop();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      if (lenis && typeof lenis.start === 'function') {
        lenis.start();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'verify') {
      // Handle OTP Verification
      if (!verifyCode.trim()) {
        setError('Please enter the 6-digit verification code.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), code: verifyCode.trim() }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          const finalUser = { ...data.user, isVerified: true };
          try {
            localStorage.setItem('hea_session', JSON.stringify(finalUser));
            sessionStorage.setItem('hea_session', JSON.stringify(finalUser));
          } catch {}
          setSuccessMsg('Email verified successfully! Launching dashboard...');
          setTimeout(() => {
            window.location.href = '/app.html#dashboard';
          }, 800);
        } else {
          setError(data.error || 'Invalid verification code. Please try again.');
        }
      } catch {
        setError('Network error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'signup') {
      // Handle Registration
      if (!email.trim() || !password.trim()) {
        setError('Email and password are required.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || email.split('@')[0],
            email: email.trim().toLowerCase(),
            password,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data.devCode) {
            setDevCode(data.devCode);
          }
          setMode('verify');
          setSuccessMsg('Account created! Please enter verification code.');
        } else {
          setError(data.error || 'Registration failed. Email may already be registered.');
        }
      } catch {
        setError('Network error during registration.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Handle Login
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (res.status === 403 && data.error === 'email_not_verified') {
        if (data.devCode) setDevCode(data.devCode);
        setMode('verify');
        setError('Email not yet verified. Please enter the code below.');
        setIsLoading(false);
        return;
      }

      if (res.ok) {
        // If login requires OTP verification
        if (data.devCode || data.emailSent) {
          if (data.devCode) setDevCode(data.devCode);
          setMode('verify');
          setSuccessMsg('Verification code sent to ' + email + '!');
        } else if (data.user) {
          // Direct login success
          const finalUser = { ...data.user, isVerified: true };
          try {
            localStorage.setItem('hea_session', JSON.stringify(finalUser));
            sessionStorage.setItem('hea_session', JSON.stringify(finalUser));
          } catch {}
          setSuccessMsg('Welcome back! Launching dashboard...');
          setTimeout(() => {
            window.location.href = '/app.html#dashboard';
          }, 800);
        }
      } else {
        setError(data.error || 'Invalid email or password.');
      }
    } catch {
      setError('Network connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSso = () => {
    // Forward to full authentication page which initializes Google Identity SDK
    window.location.href = '/app.html#login';
  };

  const autoFillCode = () => {
    if (devCode) {
      setVerifyCode(devCode);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0b132b]/65 backdrop-blur-md"
        />

        {/* Scroll Centering Wrapper */}
        <div className="min-h-full flex items-center justify-center p-4 py-8 sm:py-12">
          {/* Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 z-10 space-y-5 my-auto"
          >
            {/* Prominent Close Cross Button */}
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all z-20 cursor-pointer shadow-xs"
              aria-label="Close"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 justify-center mb-1">
              <svg className="w-7 h-5 text-[#0070f3]" viewBox="0 0 54 36" fill="none">
                <path
                  d="M15.5 8C10.25 8 6 12.25 6 17.5C6 22.75 10.25 27 15.5 27C21.2 27 24.6 20.8 27 17.5C29.4 14.2 32.8 8 38.5 8C43.75 8 48 12.25 48 17.5C48 22.75 43.75 27 38.5 27C32.8 27 29.4 20.8 27 17.5C24.6 14.2 21.2 8 15.5 8Z"
                  stroke="#0070f3"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-extrabold text-xl text-[#0070f3]">HEA Link</span>
            </div>

            <h3 className="text-2xl font-extrabold text-[#0b132b] tracking-tight">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Free Account'}
              {mode === 'verify' && 'Verify Your Email'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              {mode === 'login' && 'Log in to manage your short links, QR codes, and analytics.'}
              {mode === 'signup' && 'Start shortening links with custom branding in under 30 seconds.'}
              {mode === 'verify' && `Enter the 6-digit OTP verification code sent to ${email}.`}
            </p>
          </div>

          {/* Mode Switcher Tabs (Login / Signup) */}
          {mode !== 'verify' && (
            <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-white text-[#0070f3] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-[#0070f3] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign Up Free
              </button>
            </div>
          )}

          {/* Google SSO Button */}
          {mode !== 'verify' && (
            <div>
              <button
                type="button"
                onClick={handleGoogleSso}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-2 text-slate-400 font-semibold">Or email</span>
                </div>
              </div>
            </div>
          )}

          {/* Dev Test Code Banner (When SMTP is not configured) */}
          {mode === 'verify' && devCode && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1.5">
              <div className="flex items-center justify-between font-bold">
                <span>⚡ Test Verification Code:</span>
                <span className="font-mono text-sm tracking-widest text-[#0070f3] bg-white px-2 py-0.5 rounded border border-blue-200">
                  {devCode}
                </span>
              </div>
              <button
                type="button"
                onClick={autoFillCode}
                className="w-full py-1 text-center bg-[#0070f3] text-white rounded font-semibold text-[11px] hover:bg-blue-600 transition-colors"
              >
                Auto-fill Code
              </button>
            </div>
          )}

          {/* Error & Success Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {mode !== 'verify' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    {mode === 'login' && (
                      <a href="/app.html#login" className="text-[11px] text-[#0070f3] hover:underline">
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'verify' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="123456"
                  className="w-full py-3 px-4 text-center tracking-widest font-mono text-lg font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0070f3] transition-all"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0070f3] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>
                {isLoading ? (
                  'Processing...'
                ) : mode === 'login' ? (
                  'Log in to Account'
                ) : mode === 'signup' ? (
                  'Create Free Account'
                ) : (
                  'Verify & Launch Dashboard'
                )}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="pt-2 text-center border-t border-slate-100 text-xs text-slate-500">
            <a
              href="/app.html#login"
              className="text-[#0070f3] hover:underline font-semibold"
            >
              Or open standalone full-screen auth page →
            </a>
          </div>
        </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
