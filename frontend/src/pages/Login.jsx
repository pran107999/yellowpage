import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      login(res.data.token, res.data.user);
      toast.success('Logged in successfully!');
      navigate(res.data.user.role === 'admin' ? '/admin' : '/classifieds');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error
        || (Array.isArray(data?.errors) && data.errors[0]?.msg)
        || (err.code === 'ERR_NETWORK' ? 'Cannot reach backend. Add VITE_BACKEND_URL in Vercel (Settings → Env Variables), set it to your Render URL, then redeploy.' : 'Login failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl text-amber-400 mb-2">Welcome back</h1>
        <p className="text-slate-400">Sign in to manage your classifieds</p>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card p-8 space-y-6"
      >
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
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Password</label>
          <input
            type="password"
            {...register('password', { required: 'Password is required' })}
            className="input-base"
          />
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="text-center text-slate-500 mt-8">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-amber-400 hover:text-amber-300 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
