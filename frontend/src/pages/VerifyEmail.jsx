import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const OTP_LENGTH = 6;
const OTP_REGEX = /^\d{6}$/;

function normalizeCode(input) {
  return String(input || '').replace(/\s/g, '').trim();
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const emailFromState = location.state?.email;
  const requireVerification = location.state?.requireVerification;
  const hasToken = typeof localStorage !== 'undefined' && localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = normalizeCode(code);
    if (!OTP_REGEX.test(trimmed)) {
      toast.error('Please enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { code: trimmed });
      setSuccess(true);
      refreshUser?.();
      toast.success('Email verified successfully.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification');
      toast.success('New code sent. Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send code.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!authLoading && !user && !hasToken) {
    navigate('/login', { replace: true });
    return null;
  }
  if (user?.emailVerified && !success) {
    navigate('/classifieds', { replace: true });
    return null;
  }
  if (!user && !emailFromState) {
    if (authLoading || hasToken) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading your account...</p>
        </div>
      );
    }
    navigate('/login', { replace: true });
    return null;
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 md:py-24">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-xl text-amber-400 mb-2">Email verified</h1>
          <p className="text-slate-400 mb-6">Your email has been verified successfully.</p>
          <Link to="/classifieds" className="btn-primary inline-block">
            Browse classifieds
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl text-amber-400 mb-2">Verify your email</h1>
        {requireVerification && (
          <p className="text-amber-200/90 text-sm mb-3">You need to verify your email to post or manage ads.</p>
        )}
        <p className="text-slate-400">
          We sent a 6-digit code to {user?.email || emailFromState || 'your email'}. Enter it below.
        </p>
      </div>
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-300 mb-2 font-medium">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
              className="input-base text-center text-2xl tracking-[0.4em] font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading || code.length !== OTP_LENGTH}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>
        <p className="text-center text-slate-500 text-sm mt-6">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="text-amber-400 hover:text-amber-300 disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend code'}
          </button>
        </p>
        {import.meta.env.DEV && (
          <p className="text-center text-slate-500 text-xs mt-4">
            In development, if the email didn’t arrive, check the backend terminal for the 6-digit code.
          </p>
        )}
      </div>
    </div>
  );
}
