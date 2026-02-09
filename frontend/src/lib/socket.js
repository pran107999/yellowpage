import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';
const USE_WSS = import.meta.env.VITE_USE_WSS === 'true';

function getSocketOptions() {
  const token = localStorage.getItem('token');
  return {
    path: '/socket.io',
    autoConnect: true,
    auth: token ? { token } : {},
    secure: USE_WSS,
    transports: ['websocket', 'polling'],
  };
}

export const socket = io(SOCKET_URL || window.location.origin, getSocketOptions());

/** Reconnect with current token (call after login/logout) */
export function reconnectSocket() {
  const token = localStorage.getItem('token');
  socket.auth = token ? { token } : {};
  socket.disconnect();
  socket.connect();
}

/** Disconnect (call on logout) */
export function disconnectSocket() {
  socket.disconnect();
}
