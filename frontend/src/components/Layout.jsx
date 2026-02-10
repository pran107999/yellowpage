import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

function ResendVerificationButton() {
  const [sending, setSending] = useState(false);
  const { refreshUser } = useAuth();
  const handleResend = () => {
    setSending(true);
    api
      .post('/auth/resend-verification')
      .then(() => {
        toast.success('Verification email sent. Check your inbox.');
        refreshUser?.();
      })
      .catch((err) => {
        toast.error(err.response?.data?.error || 'Failed to send email');
      })
      .finally(() => setSending(false));
  };
  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={sending}
      className="text-sm font-medium text-amber-400 hover:text-amber-300 disabled:opacity-50"
    >
      {sending ? 'Sending...' : 'Resend code'}
    </button>
  );
}

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {user && user.emailVerified === false && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-3">
            <p className="text-amber-200/90 text-sm">
              Please verify your email. Check your inbox for the 6-digit code.
            </p>
            <Link to="/verify-email" className="text-sm font-medium text-amber-400 hover:text-amber-300">
              Enter code
            </Link>
            <ResendVerificationButton />
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="font-display text-2xl text-amber-400 hover:text-amber-300 transition-colors duration-200 tracking-tight"
          >
            DesiNetwork
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className="px-3 py-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/5 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              Home
            </Link>
            <Link
              to="/classifieds"
              className="px-3 py-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/5 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              Classifieds
            </Link>
            {user ? (
              <>
                <Link
                  to="/my-classifieds"
                  className="px-3 py-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/5 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  My Ads
                </Link>
                {user.emailVerified ? (
                  <Link
                    to="/classifieds/create"
                    className="btn-primary !px-4 !py-2 text-sm"
                  >
                    Post Ad
                  </Link>
                ) : (
                  <Link
                    to="/verify-email"
                    className="btn-primary !px-4 !py-2 text-sm opacity-90"
                    title="Verify your email to post ads"
                  >
                    Post Ad
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3 py-2 text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/5 rounded-lg transition-all duration-200 text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
                <span className="hidden sm:inline text-slate-500 text-sm px-3 border-l border-slate-700">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors duration-200 text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/5 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary !px-4 !py-2 text-sm"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800/80 py-8 mt-16 bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} DesiNetwork. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
