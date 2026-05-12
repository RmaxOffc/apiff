const express = require('express');
const axios = require('axios');
const router = express.Router();

const TARGET_API = process.env.TARGET_API || 'https://emoterara.pages.dev/api';

// Helper function
async function forwardRequest(action, req, res, customBody = null, method = null) {
  const startTime = Date.now();
  const body = customBody || req.body;
  const reqMethod = method || req.method;
  
  console.log(`[FORWARD] ${reqMethod} /${action}`, JSON.stringify(body).substring(0, 200));
  
  try {
    const response = await axios({
      method: reqMethod,
      url: `${TARGET_API}?action=${action}`,
      data: reqMethod === 'POST' ? body : undefined,
      params: reqMethod === 'GET' ? body : req.query,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
    
    const duration = Date.now() - startTime;
    console.log(`[RESPONSE] /${action} - ${response.status} (${duration}ms)`);
    res.status(response.status).json(response.data);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ERROR] /${action} - ${error.message} (${duration}ms)`);
    
    if (error.response) {
      res.status(error.response.status).json({
        status: 'error',
        message: error.response.data?.message || error.message,
        code: error.response.status
      });
    } else if (error.request) {
      res.status(503).json({
        status: 'error',
        message: 'Target API tidak merespons',
        error: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
}

// ========== 1. PERFORM EMOTE ==========
router.post('/emote', async (req, res) => {
  const { region, tc, emote_id, uids } = req.body;
  
  if (!region || !tc || !emote_id || !uids || !Array.isArray(uids) || uids.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Parameter tidak lengkap! required: region, tc, emote_id, uids (array)'
    });
  }
  
  if (uids.length > 10) {
    return res.status(400).json({
      status: 'error',
      message: 'Maksimal 10 UID dalam satu request'
    });
  }
  
  await forwardRequest('emote', req, res);
});

// ========== 2. BOT INVITE ==========
router.post('/bot_invite', async (req, res) => {
  const { region, size, invite_uid, leave } = req.body;
  
  if (!region || !size || !invite_uid) {
    return res.status(400).json({
      status: 'error',
      message: 'Parameter tidak lengkap! required: region, size, invite_uid'
    });
  }
  
  if (!['5', '6'].includes(String(size))) {
    return res.status(400).json({
      status: 'error',
      message: 'Size harus 5 atau 6'
    });
  }
  
  await forwardRequest('bot_invite', req, res);
});

// ========== 3. JOIN TEAM ==========
router.post('/join_team', async (req, res) => {
  const { region, tc } = req.body;
  if (!region || !tc) {
    return res.status(400).json({ status: 'error', message: 'required: region, tc' });
  }
  await forwardRequest('join_team', req, res);
});

// ========== 4. FORCE LEAVE ==========
router.post('/force_leave', async (req, res) => {
  const { region, key } = req.body;
  if (!region || !key) {
    return res.status(400).json({ status: 'error', message: 'required: region, key' });
  }
  await forwardRequest('force_leave', req, res);
});

// ========== 5. BAN CHECK ==========
router.get('/ban_check', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  await forwardRequest('ban_check', req, res);
});

// ========== 6. PLAYER INFO V2 ==========
router.get('/player_info', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  await forwardRequest('player_info', req, res);
});

// ========== 7. PLAYER INFO V1 ==========
router.get('/player_info_v1', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  await forwardRequest('player_info_v1', req, res);
});

// ========== 8. PLAYER STATS ==========
router.get('/player_stats', async (req, res) => {
  const { uid, region, gamemode, matchmode } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  await forwardRequest('player_stats', req, res);
});

// ========== 9. OUTFIT IMAGE ==========
router.get('/outfit', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  await forwardRequest('outfit', req, res);
});

// ========== 10. VISIT SPAM ==========
router.get('/visit_spam', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  await forwardRequest('visit_spam', req, res);
});

// ========== 11. PROFILE BANNER ==========
router.get('/profile_banner', async (req, res) => {
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ status: 'error', message: 'required: uid' });
  }
  await forwardRequest('profile_banner', req, res);
});

// ========== 12. JWT GENERATE ==========
router.get('/jwt_generate', async (req, res) => {
  const { uid, password } = req.query;
  if (!uid || !password) {
    return res.status(400).json({ status: 'error', message: 'required: uid, password' });
  }
  await forwardRequest('jwt_generate', req, res);
});

// ========== 13. JWT DECODE ==========
router.get('/jwt_decode', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ status: 'error', message: 'required: token' });
  }
  await forwardRequest('jwt_decode', req, res);
});

// ========== 14. JWT CONVERT ==========
router.get('/jwt_convert', async (req, res) => {
  const { access_token } = req.query;
  if (!access_token) {
    return res.status(400).json({ status: 'error', message: 'required: access_token' });
  }
  await forwardRequest('jwt_convert', req, res);
});

// ========== 15. BIO UPDATE (JWT) ==========
router.get('/bio_update', async (req, res) => {
  const { token, bio, region } = req.query;
  if (!token || !bio) {
    return res.status(400).json({ status: 'error', message: 'required: token, bio' });
  }
  await forwardRequest('bio_update', req, res);
});

// ========== 16. BIO UPDATE (ACCESS TOKEN) ==========
router.get('/bio_update_access', async (req, res) => {
  const { access_token, bio } = req.query;
  if (!access_token || !bio) {
    return res.status(400).json({ status: 'error', message: 'required: access_token, bio' });
  }
  await forwardRequest('bio_update_access', req, res);
});

// ========== 17. CASHIFY GENERATE ==========
router.post('/cashify_generate', async (req, res) => {
  const { amount, packageIds, expiredInMinutes } = req.body;
  if (!amount || !packageIds) {
    return res.status(400).json({ status: 'error', message: 'required: amount, packageIds' });
  }
  await forwardRequest('cashify_generate', req, res);
});

// ========== 18. CASHIFY STATUS ==========
router.post('/cashify_status', async (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) {
    return res.status(400).json({ status: 'error', message: 'required: transactionId' });
  }
  await forwardRequest('cashify_status', req, res);
});

// ========== 19. CASHIFY CANCEL ==========
router.post('/cashify_cancel', async (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) {
    return res.status(400).json({ status: 'error', message: 'required: transactionId' });
  }
  await forwardRequest('cashify_cancel', req, res);
});

// ========== 20. TELEGRAM NOTIFY ==========
router.post('/notify_telegram', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ status: 'error', message: 'required: message' });
  }
  
  // Kirim ke Telegram bot jika ada konfigurasi
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      });
      res.json({ status: 'success', message: 'Notifikasi terkirim ke Telegram' });
    } catch (error) {
      res.json({ status: 'success', message: 'Notifikasi diterima (Telegram gagal)' });
    }
  } else {
    res.json({ status: 'success', message: 'Notifikasi diterima' });
  }
});

// ========== FALLBACK ==========
router.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint ${req.method} ${req.url} tidak ditemukan`
  });
});

module.exports = router;
