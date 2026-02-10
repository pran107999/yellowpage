import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';

const OTP_LENGTH = 6;

export default function ResetPassword() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    const trimmedCode = code.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (trimmedCode.length !== 6) {
      toast.error('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        code: trimmedCode,
        password: data.password,
      });
      setSuccess(true);
      toast.success('Password reset successfully. Sign in with your new password.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 md:py-24">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-xl text-amber-400 mb-2">Password reset</h1>
          <p className="text-slate-400 mb-6">Your password has been updated. Sign in with your new password.</p>
          <Link to="/login" className="btn-primary inline-block">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl text-amber-400 mb-2">Reset password</h1>
        <p className="text-slate-400">Enter the 6-digit code from your email and your new password</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Reset code</label>
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
          {code.length > 0 && code.length !== 6 && (
            <p className="text-amber-400 text-sm mt-1">Code must be 6 digits</p>
          )}
        </div>
        <div>
          <label className="block text-slate-300 mb-2 font-medium">New password</label>
          <input
            type="password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            })}
            className="input-base"
          />
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Confirm password</label>
          <input
            type="password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (v) => v === password || 'Passwords do not match',
            })}
            className="input-base"
          />
          {errors.confirmPassword && (
            <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
      <p className="text-center text-slate-500 mt-8">
        <Link to="/login" className="text-amber-400 hover:text-amber-300 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
