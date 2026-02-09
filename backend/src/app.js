const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const classifiedRoutes = require('./routes/classifieds');
const cityRoutes = require('./routes/cities');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/classifieds', classifiedRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
