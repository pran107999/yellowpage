import axios from 'axios';

const backendBase = import.meta.env.VITE_BACKEND_URL || '';
const baseURL = backendBase ? backendBase + '/api' : '/api';
if (import.meta.env.PROD && !backendBase) {
  console.warn('[DesiNetwork] VITE_BACKEND_URL is not set. Add it in Vercel → Settings → Environment Variables and redeploy.');
}
const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000, // 90s for Render cold start on free tier
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
