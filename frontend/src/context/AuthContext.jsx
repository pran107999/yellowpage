import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { reconnectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        reconnectSocket();
      })
      .catch(() => {
        localStorage.removeItem('token');
        disconnectSocket();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    reconnectSocket();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    disconnectSocket();
  };

  const refreshUser = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return Promise.resolve();
    return api.get('/auth/me').then((res) => {
      setUser(res.data.user);
      return res.data.user;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
