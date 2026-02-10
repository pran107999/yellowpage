import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slowMessage, setSlowMessage] = useState(false);
  const slowTimer = useRef(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    return () => {
      if (slowTimer.current) clearTimeout(slowTimer.current);
    };
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setSlowMessage(false);
    if (slowTimer.current) clearTimeout(slowTimer.current);
    slowTimer.current = setTimeout(() => setSlowMessage(true), 15000);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
      toast.success('Check your email for the reset code.');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to send reset code. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
      setSlowMessage(false);
      if (slowTimer.current) {
        clearTimeout(slowTimer.current);
        slowTimer.current = null;
      }
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 md:py-24">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-xl text-amber-400 mb-2">Check your email</h1>
          <p className="text-slate-400 mb-6">
            If an account exists, a 6-digit reset code has been sent. Enter it on the next page.
          </p>
          <Link to="/reset-password" className="btn-primary inline-block">
            Reset password
          </Link>
        </div>
        <p className="text-center text-slate-500 mt-8">
          <Link to="/login" className="text-amber-400 hover:text-amber-300 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl text-amber-400 mb-2">Forgot password</h1>
        <p className="text-slate-400">Enter your email to receive a reset code</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Email</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            className="input-base"
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send reset code'}
        </button>
        {slowMessage && (
          <p className="text-amber-400/90 text-sm text-center mt-2">
            Server may be waking up—this can take up to a minute. Please wait or try again.
          </p>
        )}
      </form>
      <p className="text-center text-slate-500 mt-8">
        <Link to="/login" className="text-amber-400 hover:text-amber-300 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
