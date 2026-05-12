const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const cache = new NodeCache({ stdTTL: 300 }); // cache 5 menit

// ========== MIDDLEWARE ==========
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { status: 'error', message: 'Too many requests, slow down!' }
});
app.use('/api/', limiter);

// ========== TARGET API ==========
const TARGET_API = process.env.TARGET_API || 'https://emoterara.pages.dev/api';

// ========== LOGGING ==========
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ========== HEALTH CHECK ==========
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'FF API by Rmax is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/emote', '/api/bot_invite', '/api/join_team', '/api/force_leave',
      '/api/ban_check', '/api/player_info', '/api/player_info_v1', '/api/player_stats',
      '/api/outfit', '/api/visit_spam', '/api/profile_banner',
      '/api/jwt_generate', '/api/jwt_decode', '/api/jwt_convert',
      '/api/bio_update', '/api/bio_update_access',
      '/api/cashify_generate', '/api/cashify_status', '/api/cashify_cancel',
      '/api/notify_telegram'
    ]
  });
});

// ========== ROUTES ==========
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`🚀 FF API by Rmax running on port ${PORT}`);
  console.log(`📍 Target API: ${TARGET_API}`);
  console.log(`📡 Ready to accept requests`);
});
