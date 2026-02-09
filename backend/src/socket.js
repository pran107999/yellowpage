const jwt = require('jsonwebtoken');
const pool = require('./config/db');

let io = null;

const MAX_CONNECTIONS_PER_USER = 5;
const PING_TIMEOUT_MS = 60_000;  // 60s idle -> disconnect
const PING_INTERVAL_MS = 25_000; // ping every 25s

const connectionsByUser = new Map(); // userId -> Set<socketId>

function verifyToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return decoded.userId;
  } catch {
    return null;
  }
}

async function validateUser(userId) {
  const result = await pool.query(
    'SELECT id FROM users WHERE id = $1',
    [userId]
  );
  return result.rows.length > 0;
}

function enforceConnectionLimit(userId, socketId) {
  if (!connectionsByUser.has(userId)) {
    connectionsByUser.set(userId, new Set());
  }
  const set = connectionsByUser.get(userId);
  if (set.size >= MAX_CONNECTIONS_PER_USER) {
    return false;
  }
  set.add(socketId);
  return true;
}

function removeConnection(userId, socketId) {
  const set = connectionsByUser.get(userId);
  if (set) {
    set.delete(socketId);
    if (set.size === 0) connectionsByUser.delete(userId);
  }
}

function validateClientMessage(event, payload) {
  // Only server emits to clients; client messages are validated here if we add any
  const ALLOWED_EVENTS = [];
  if (!ALLOWED_EVENTS.includes(event)) return false;
  if (typeof payload !== 'object' || payload === null) return false;
  return true;
}

function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173' },
    path: '/socket.io',
    pingTimeout: PING_TIMEOUT_MS,
    pingInterval: PING_INTERVAL_MS,
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    const userId = verifyToken(token);
    if (userId) {
      const valid = await validateUser(userId);
      if (!valid) return next(new Error('User not found'));
      if (!enforceConnectionLimit(userId, socket.id)) return next(new Error('Too many connections'));
      socket.userId = userId;
    } else {
      socket.userId = null; // Anonymous (guests) - allow for real-time updates
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, 'user:', socket.userId);

    socket.on('disconnect', (reason) => {
      if (socket.userId) removeConnection(socket.userId, socket.id);
      console.log('Client disconnected:', socket.id, reason);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', socket.id, err.message);
    });

    // Validate any incoming client messages
    const originalOnevent = socket.onevent;
    socket.onevent = function (packet) {
      const args = packet.data || [];
      const event = args[0];
      if (event && event !== 'disconnect' && event !== 'error') {
        if (!validateClientMessage(event, args[1])) {
          console.warn('Invalid message ignored:', event);
          return;
        }
      }
      originalOnevent.call(this, packet);
    };
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

function emitClassifiedsChanged() {
  if (io) io.emit('classifieds:changed');
}

function emitAdminChanged() {
  if (io) io.emit('admin:changed');
}

module.exports = { initSocket, getIO, emitClassifiedsChanged, emitAdminChanged };
