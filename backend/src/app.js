const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { isSupabaseStorage } = require('./services/storage');
const authRoutes = require('./routes/auth');
const classifiedRoutes = require('./routes/classifieds');
const cityRoutes = require('./routes/cities');
const adminRoutes = require('./routes/admin');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Serve uploaded images (path: /api/uploads/...)
app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/classifieds', classifiedRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    storage: isSupabaseStorage() ? 'supabase' : 'local (images may not persist on Render)',
  });
});

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Image must be less than 10MB' });
  }
  if (err.message && err.message.includes('images')) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
