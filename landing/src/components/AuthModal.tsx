import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { signInWithGooglePopup } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup' | 'verify';
  onClose: () => void;
}

export function AuthModal({ isOpen, initialMode = 'login', onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devCode, setDevCode] = useState('');

  // Sync mode whenever initialMode changes
  useEffect(() => {
    setMode(initialMode);
    setError('');
    setSuccessMsg('');
  }, [initialMode, isOpen]);

  // Handle ESC key to close modal & lock background scroll
  useEffect(() => {
    if (!isOpen) return;

    // Lock background scroll (standard and Lenis smooth scroll)
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

  const handleGoogleSso = async () => {
    try {
      setIsLoading(true);
      setError('');
      const { idToken, user } = await signInWithGooglePopup();

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0],
          photoUrl: user.photoURL,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Signed in with Google! Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = '/app.html';
        }, 600);
      } else {
        setError(data.error || 'Google authentication failed. Please try again.');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          if (data.requiresVerification) {
            setMode('verify');
            setSuccessMsg('Verification code sent! Please check your inbox.');
            if (data.devCode) {
              setDevCode(data.devCode);
            }
          } else {
            setSuccessMsg('Account created! Redirecting...');
            setTimeout(() => {
              window.location.href = '/app.html';
            }, 800);
          }
        } else {
          setError(data.error || 'Failed to create account. Please try again.');
        }
      } else if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg('Login successful! Redirecting...');
          setTimeout(() => {
            window.location.href = '/app.html';
          }, 600);
        } else if (data.requiresVerification) {
          setMode('verify');
          setError('Email verification required. Code sent to your inbox.');
          if (data.devCode) {
            setDevCode(data.devCode);
          }
        } else {
          setError(data.error || 'Invalid email or password.');
        }
      } else if (mode === 'verify') {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: verifyCode }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg('Email verified successfully! Redirecting...');
          setTimeout(() => {
            window.location.href = '/app.html';
          }, 800);
        } else {
          setError(data.error || 'Invalid or expired code. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const autoFillCode = () => {
    if (devCode) {
      setVerifyCode(devCode);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain">
        {/* Soft Frosted Glass Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0b132b]/30 backdrop-blur-md"
        />

        {/* Scroll Centering Wrapper */}
        <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
          {/* Modal Window: Frosted Glass Transparent Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full max-w-[400px] bg-white/75 backdrop-blur-2xl rounded-3xl p-5 sm:p-5 shadow-[0_20px_60px_rgba(0,112,243,0.18),0_0_0_1px_rgba(255,255,255,0.7)] border border-white/80 z-10 space-y-3 my-auto"
          >
            {/* Prominent Close Cross Button */}
            <button
              onClick={onClose}
              type="button"
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/70 hover:bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all z-20 cursor-pointer shadow-xs border border-white/90"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {/* Brand Header */}
            <div className="text-center space-y-0.5">
              <div className="inline-flex items-center gap-1.5 justify-center">
                <svg className="w-5 h-3.5 text-[#0070f3]" viewBox="0 0 54 36" fill="none">
                  <path
                    d="M15.5 8C10.25 8 6 12.25 6 17.5C6 22.75 10.25 27 15.5 27C21.2 27 24.6 20.8 27 17.5C29.4 14.2 32.8 8 38.5 8C43.75 8 48 12.25 48 17.5C48 22.75 43.75 27 38.5 27C32.8 27 29.4 20.8 27 17.5C24.6 14.2 21.2 8 15.5 8Z"
                    stroke="#0070f3"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-extrabold text-base text-[#0070f3]">HEA Link</span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-[#0b132b] tracking-tight">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Create Free Account'}
                {mode === 'verify' && 'Verify Your Email'}
              </h3>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                {mode === 'login' && 'Log in to manage your short links, QR codes, and analytics.'}
                {mode === 'signup' && 'Start shortening links with custom branding in seconds.'}
                {mode === 'verify' && `Enter the 6-digit OTP verification code sent to ${email}.`}
              </p>
            </div>

            {/* Mode Switcher Tabs (Login / Signup) */}
            {mode !== 'verify' && (
              <div className="flex bg-slate-200/40 backdrop-blur-sm p-1 rounded-2xl text-xs font-bold border border-white/60">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className={`flex-1 py-1 rounded-xl transition-all ${
                    mode === 'login'
                      ? 'bg-white/95 text-[#0070f3] shadow-xs'
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
                  className={`flex-1 py-1 rounded-xl transition-all ${
                    mode === 'signup'
                      ? 'bg-white/95 text-[#0070f3] shadow-xs'
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
                  className="w-full py-2 px-3 rounded-xl border border-white/90 bg-white/70 hover:bg-white text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
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

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/70" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white/80 px-2 text-slate-400 font-bold backdrop-blur-sm rounded">Or email</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dev Test Code Banner (When SMTP is not configured) */}
            {mode === 'verify' && devCode && (
              <div className="p-2.5 bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
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
              <div className="p-2.5 rounded-xl bg-rose-50/90 backdrop-blur-sm border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50/90 backdrop-blur-sm border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200/80 bg-white/70 focus:bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {mode !== 'verify' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200/80 bg-white/70 focus:bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] font-semibold text-slate-700">Password</label>
                      {mode === 'login' && (
                        <a href="/app.html#login" className="text-[10px] text-[#0070f3] hover:underline font-medium">
                          Forgot password?
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200/80 bg-white/70 focus:bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === 'verify' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="123456"
                    className="w-full py-2 px-3 text-center tracking-widest font-mono text-base font-bold rounded-xl border border-slate-200/80 bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0070f3] transition-all"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1.5 py-2.5 px-4 rounded-xl bg-[#0070f3] hover:bg-blue-600 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
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

            {/* Footer Security Badge */}
            <div className="pt-1.5 text-center border-t border-slate-200/60 text-[10.5px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0070f3]" />
              <span>End-to-end encrypted with HEA Cloud Auth</span>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
