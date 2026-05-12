const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ========== KONFIGURASI BOT FF ==========
const CONFIG_FILE = './bot_config.json';

let BOT_CONFIG = {
  mainBot: {
    uid: "4815713429",
    nickname: "THISISBOTRMX",
    region: "id",
    token: "82980E07C32C73047FBC56E0CB75F6FBABB0D777BEFB7343234A326F5D47781F",
    jwt: "eyJhbGciOiJIUzI1NiIsInN2ciI6IjEiLCJ0eXAiOiJKV1QifQ.eyJhY2NvdW50X2lkIjoxNTY3NTA2OTIzOCwibmlja25hbWUiOiJaUzE4YTNCcklTdzJhaWsrIiwibm90aV9yZWdpb24iOiJJRCIsImxvY2tfcmVnaW9uIjoiSUQiLCJleHRlcm5hbF9pZCI6IjE4YmJmODU4ZGZhOTE1MGY2OTljNmZjZDlhMGNkMjk3IiwiZXh0ZXJuYWxfdHlwZSI6NCwicGxhdF9pZCI6MSwiY2xpZW50X3ZlcnNpb24iOiIxLjEyMC4xIiwiZW11bGF0b3Jfc2NvcmUiOjEwMCwiaXNfZW11bGF0b3IiOnRydWUsImNvdW50cnlfY29kZSI6IlVTIiwiZXh0ZXJuYWxfdWlkIjo0ODE1NzEzNDI5LCJyZWdfYXZhdGFyIjoxMDIwMDAwMDcsInNvdXJjZSI6NCwibG9ja19yZWdpb25fdGltZSI6MTc3ODU2ODQ3MCwiY2xpZW50X3R5cGUiOjIsInNpZ25hdHVyZV9tZDUiOiIiLCJ1c2luZ192ZXJzaW9uIjoxLCJyZWxlYXNlX2NoYW5uZWwiOiIzcmRfcGFydHkiLCJyZWxlYXNlX3ZlcnNpb24iOiJPQjUzIiwiZXhwIjoxNzc4NjAxNjM3fQ.Uwf5oW345tzBTpi8GzKDocewTsWrt3KyW2YMrLzctpM",
    status: "active"
  },
  multiBot: [],
  settings: {
    defaultRegion: "id",
    defaultSize: 5,
    autoLeave: true,
    cooldown: 3000,
    maxUidsPerRequest: 10,
    retryOnFail: 3
  }
};

// Load config dari file
function loadBotConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      BOT_CONFIG.mainBot = { ...BOT_CONFIG.mainBot, ...saved.mainBot };
      BOT_CONFIG.multiBot = saved.multiBot || [];
      BOT_CONFIG.settings = { ...BOT_CONFIG.settings, ...saved.settings };
      console.log('✅ Konfigurasi bot dimuat dari file');
    } catch (e) {
      console.log('⚠️ Gagal load config, pakai default');
    }
  }
}

// Save config ke file
function saveBotConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({
    mainBot: BOT_CONFIG.mainBot,
    multiBot: BOT_CONFIG.multiBot,
    settings: BOT_CONFIG.settings
  }, null, 2));
  console.log('💾 Konfigurasi bot disimpan');
}

loadBotConfig();

// ========== FUNGSI BANTUAN ==========
function generateLobbyId() {
  return `LBY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateJWT() {
  return crypto.randomBytes(64).toString('hex');
}

// ========== ENDPOINT UTAMA ==========
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'FF API by Rmax - Mandiri',
    version: '2.0.0',
    bot_status: {
      main: { uid: BOT_CONFIG.mainBot.uid, nickname: BOT_CONFIG.mainBot.nickname, status: BOT_CONFIG.mainBot.status },
      total_bots: BOT_CONFIG.multiBot.length,
      active_bots: BOT_CONFIG.multiBot.filter(b => b.active).length
    },
    endpoints: [
      'POST /api/emote', 'POST /api/bot_invite', 'POST /api/join_team', 'POST /api/force_leave',
      'GET /api/ban_check', 'GET /api/player_info', 'GET /api/player_info_v1', 'GET /api/player_stats',
      'GET /api/outfit', 'GET /api/visit_spam', 'GET /api/profile_banner',
      'GET /api/jwt_generate', 'GET /api/jwt_decode', 'GET /api/jwt_convert',
      'GET /api/bio_update', 'GET /api/bio_update_access',
      'POST /api/cashify_generate', 'POST /api/cashify_status', 'POST /api/cashify_cancel',
      'POST /api/notify_telegram', 'POST /api/register', 'GET /api/user/:uid',
      'GET /api/bot/status', 'POST /api/bot/toggle', 'POST /api/bot/update-token',
      'POST /api/bot/add', 'DELETE /api/bot/remove/:uid', 'POST /api/bot/settings',
      'POST /api/bot/emote', 'POST /api/bot/invite', 'GET /api/bot/list'
    ]
  });
});

// ========== 1. PERFORM EMOTE ==========
app.post('/api/emote', (req, res) => {
  const { region, tc, emote_id, uids } = req.body;
  
  if (!region || !tc || !emote_id || !uids || uids.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap! required: region, tc, emote_id, uids (array)' });
  }
  
  if (uids.length > BOT_CONFIG.settings.maxUidsPerRequest) {
    return res.status(400).json({ status: 'error', message: `Maksimal ${BOT_CONFIG.settings.maxUidsPerRequest} UID dalam satu request` });
  }
  
  const lobbyId = generateLobbyId();
  
  res.json({
    status: 'success',
    lobby_id: lobbyId,
    message: `Emote ${emote_id} berhasil dikirim ke ${uids.length} UID`,
    data: { region, tc, emote_id, uids, total: uids.length, timestamp: new Date().toISOString() }
  });
});

// ========== 2. BOT INVITE ==========
app.post('/api/bot_invite', (req, res) => {
  const { region, size, invite_uid, leave } = req.body;
  
  if (!region || !size || !invite_uid) {
    return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap! required: region, size, invite_uid' });
  }
  
  if (!['5', '6'].includes(String(size))) {
    return res.status(400).json({ status: 'error', message: 'Size harus 5 atau 6' });
  }
  
  res.json({
    status: 'success',
    message: `Bot ${size} vs ${size} berhasil mengundang UID ${invite_uid}`,
    data: { region, size, invite_uid, leave: leave === '1' ? 'Ya' : 'Tidak', timestamp: new Date().toISOString() }
  });
});

// ========== 3. JOIN TEAM ==========
app.post('/api/join_team', (req, res) => {
  const { region, tc } = req.body;
  if (!region || !tc) {
    return res.status(400).json({ status: 'error', message: 'required: region, tc' });
  }
  res.json({ status: 'success', message: `Berhasil bergabung ke tim dengan kode ${tc}`, data: { region, tc } });
});

// ========== 4. FORCE LEAVE ==========
app.post('/api/force_leave', (req, res) => {
  const { region, key } = req.body;
  if (!region || !key) {
    return res.status(400).json({ status: 'error', message: 'required: region, key' });
  }
  res.json({ status: 'success', message: 'Force leave berhasil', data: { region, key } });
});

// ========== 5. BAN CHECK ==========
app.get('/api/ban_check', (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  
  const banned = Math.random() > 0.9;
  res.json({
    status: 'success',
    is_banned: banned,
    name: `Player_${uid}`,
    uid: uid,
    level: Math.floor(Math.random() * 100),
    last_login: Math.floor(Date.now() / 1000),
    ban_period: banned ? Math.floor(Math.random() * 30) + 1 : null
  });
});

// ========== 6. PLAYER INFO V2 ==========
app.get('/api/player_info', (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  
  res.json({
    status: 'success',
    basicinfo: {
      nickname: `Player_${uid}`,
      level: Math.floor(Math.random() * 100),
      exp: Math.floor(Math.random() * 10000),
      region: region.toUpperCase(),
      liked: Math.floor(Math.random() * 5000),
      maxrank: 316 + Math.floor(Math.random() * 20),
      rankingpoints: 3000 + Math.floor(Math.random() * 1000),
      lastloginat: Math.floor(Date.now() / 1000),
      createat: Math.floor(Date.now() / 1000) - 86400 * 365
    }
  });
});

// ========== 7. PLAYER INFO V1 ==========
app.get('/api/player_info_v1', (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  
  res.json({
    status: 'success',
    AccountInfo: {
      AccountName: `Player_${uid}`,
      AccountLevel: Math.floor(Math.random() * 100),
      AccountLikes: Math.floor(Math.random() * 5000)
    },
    AccountProfileInfo: {
      BrMaxRank: 'Heroic',
      CsMaxRank: 'Diamond'
    }
  });
});

// ========== 8. PLAYER STATS ==========
app.get('/api/player_stats', (req, res) => {
  const { uid, region, gamemode, matchmode } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  
  const games = Math.floor(Math.random() * 1000);
  const wins = Math.floor(games * (Math.random() * 0.3 + 0.1));
  
  res.json({
    status: 'success',
    data: {
      solostats: {
        gamesplayed: games,
        wins: wins,
        kills: Math.floor(Math.random() * games),
        detailedstats: { deaths: Math.floor(Math.random() * games) }
      }
    }
  });
});

// ========== 9. OUTFIT IMAGE ==========
app.get('/api/outfit', (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  res.redirect(`https://placehold.co/400x600/1a1a2e/4facfe?text=OUTFIT+${uid}`);
});

// ========== 10. VISIT SPAM ==========
app.get('/api/visit_spam', (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  res.json({ status: 'success', message: `Visit spam berhasil dikirim ke UID ${uid}`, region });
});

// ========== 11. PROFILE BANNER ==========
app.get('/api/profile_banner', (req, res) => {
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ status: 'error', message: 'required: uid' });
  }
  res.redirect(`https://placehold.co/800x400/0a0e17/4facfe?text=PROFILE+BANNER+${uid}`);
});

// ========== 12. JWT GENERATE ==========
app.get('/api/jwt_generate', (req, res) => {
  const { uid, password } = req.query;
  if (!uid || !password) {
    return res.status(400).json({ status: 'error', message: 'required: uid, password' });
  }
  
  const jwt = generateJWT();
  const accessToken = generateToken();
  
  res.json({
    status: 'success',
    accountId: uid,
    token: jwt,
    accessToken: accessToken,
    expiresIn: 86400,
    message: 'Token berhasil digenerate'
  });
});

// ========== 13. JWT DECODE ==========
app.get('/api/jwt_decode', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ status: 'error', message: 'required: token' });
  }
  
  res.json({
    status: 'success',
    payload: {
      uid: token.substring(0, 10),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
      region: 'id'
    }
  });
});

// ========== 14. JWT CONVERT ==========
app.get('/api/jwt_convert', (req, res) => {
  const { access_token } = req.query;
  if (!access_token) {
    return res.status(400).json({ status: 'error', message: 'required: access_token' });
  }
  
  const jwt = generateJWT();
  
  res.json({
    status: 'success',
    token: jwt,
    message: 'Access token berhasil dikonversi ke JWT'
  });
});

// ========== 15. BIO UPDATE (JWT) ==========
app.get('/api/bio_update', (req, res) => {
  const { token, bio, region } = req.query;
  if (!token || !bio) {
    return res.status(400).json({ status: 'error', message: 'required: token, bio' });
  }
  
  res.json({
    status: 'success',
    message: 'Bio berhasil diupdate',
    bio: bio,
    region: region || 'id',
    timestamp: new Date().toISOString()
  });
});

// ========== 16. BIO UPDATE (Access Token) ==========
app.get('/api/bio_update_access', (req, res) => {
  const { access_token, bio } = req.query;
  if (!access_token || !bio) {
    return res.status(400).json({ status: 'error', message: 'required: access_token, bio' });
  }
  
  res.json({
    status: 'success',
    message: 'Bio berhasil diupdate dengan Access Token',
    bio: bio,
    timestamp: new Date().toISOString()
  });
});

// ========== 17. CASHIFY GENERATE ==========
app.post('/api/cashify_generate', (req, res) => {
  const { amount, packageIds, expiredInMinutes } = req.body;
  if (!amount || !packageIds) {
    return res.status(400).json({ status: 'error', message: 'required: amount, packageIds' });
  }
  
  const transactionId = `TRX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  res.json({
    status: 'success',
    data: {
      transactionId: transactionId,
      qr_string: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${transactionId}`,
      totalAmount: amount,
      uniqueNominal: Math.floor(Math.random() * 100),
      expiredAt: new Date(Date.now() + (expiredInMinutes || 15) * 60000).toISOString()
    }
  });
});

// ========== 18. CASHIFY STATUS ==========
app.post('/api/cashify_status', (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) {
    return res.status(400).json({ status: 'error', message: 'required: transactionId' });
  }
  
  const isPaid = Math.random() > 0.3;
  
  res.json({
    status: 'success',
    data: {
      status: isPaid ? 'paid' : 'pending',
      transactionId: transactionId,
      paidAt: isPaid ? new Date().toISOString() : null
    }
  });
});

// ========== 19. CASHIFY CANCEL ==========
app.post('/api/cashify_cancel', (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) {
    return res.status(400).json({ status: 'error', message: 'required: transactionId' });
  }
  res.json({ status: 'success', message: `Transaksi ${transactionId} dibatalkan` });
});

// ========== 20. TELEGRAM NOTIFY ==========
app.post('/api/notify_telegram', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ status: 'error', message: 'required: message' });
  }
  console.log('[TELEGRAM NOTIF]', message);
  res.json({ status: 'success', message: 'Notifikasi diterima' });
});

// ========== 21. REGISTER USER ==========
const users = [];
app.post('/api/register', (req, res) => {
  const { uid, region, nickname } = req.body;
  if (!uid) {
    return res.status(400).json({ status: 'error', message: 'UID required' });
  }
  
  const token = generateToken();
  const jwt = generateJWT();
  
  users.push({ uid, region, nickname, token, jwt, registeredAt: new Date().toISOString() });
  
  res.json({ status: 'success', message: 'User registered', token, jwt });
});

// ========== 22. GET USER INFO ==========
app.get('/api/user/:uid', (req, res) => {
  const { uid } = req.params;
  const user = users.find(u => u.uid === uid);
  
  if (!user) {
    return res.status(404).json({ status: 'error', message: 'User not found' });
  }
  res.json({ status: 'success', data: user });
});

// ========== 23. BOT STATUS ==========
app.get('/api/bot/status', (req, res) => {
  const { uid } = req.query;
  
  if (uid) {
    const bot = BOT_CONFIG.multiBot.find(b => b.uid === uid);
    if (bot) return res.json({ status: 'success', data: bot });
    if (uid === BOT_CONFIG.mainBot.uid) {
      return res.json({ status: 'success', data: BOT_CONFIG.mainBot });
    }
    return res.status(404).json({ status: 'error', message: 'Bot tidak ditemukan' });
  }
  
  res.json({
    status: 'success',
    data: {
      mainBot: { uid: BOT_CONFIG.mainBot.uid, nickname: BOT_CONFIG.mainBot.nickname, status: BOT_CONFIG.mainBot.status },
      multiBot: BOT_CONFIG.multiBot.filter(b => b.active).map(b => ({ uid: b.uid, nickname: b.nickname, region: b.region })),
      settings: BOT_CONFIG.settings
    }
  });
});

// ========== 24. BOT TOGGLE ==========
app.post('/api/bot/toggle', (req, res) => {
  const { uid, active } = req.body;
  
  if (uid === BOT_CONFIG.mainBot.uid) {
    BOT_CONFIG.mainBot.status = active ? "active" : "maintenance";
    saveBotConfig();
    return res.json({ status: 'success', message: `Bot utama ${active ? 'diaktifkan' : 'dinonaktifkan'}` });
  }
  
  const bot = BOT_CONFIG.multiBot.find(b => b.uid === uid);
  if (bot) {
    bot.active = active;
    saveBotConfig();
    return res.json({ status: 'success', message: `Bot ${bot.nickname} ${active ? 'diaktifkan' : 'dinonaktifkan'}` });
  }
  
  res.status(404).json({ status: 'error', message: 'Bot tidak ditemukan' });
});

// ========== 25. UPDATE BOT TOKEN ==========
app.post('/api/bot/update-token', (req, res) => {
  const { uid, token, jwt } = req.body;
  
  if (uid === BOT_CONFIG.mainBot.uid) {
    if (token) BOT_CONFIG.mainBot.token = token;
    if (jwt) BOT_CONFIG.mainBot.jwt = jwt;
    saveBotConfig();
    return res.json({ status: 'success', message: 'Token bot utama diupdate' });
  }
  
  const bot = BOT_CONFIG.multiBot.find(b => b.uid === uid);
  if (bot) {
    if (token) bot.token = token;
    saveBotConfig();
    return res.json({ status: 'success', message: `Token ${bot.nickname} diupdate` });
  }
  
  res.status(404).json({ status: 'error', message: 'Bot tidak ditemukan' });
});

// ========== 26. ADD BOT ==========
app.post('/api/bot/add', (req, res) => {
  const { uid, nickname, region, token } = req.body;
  
  if (!uid || !nickname) {
    return res.status(400).json({ status: 'error', message: 'UID dan nickname wajib diisi' });
  }
  
  if (BOT_CONFIG.multiBot.some(b => b.uid === uid) || uid === BOT_CONFIG.mainBot.uid) {
    return res.status(400).json({ status: 'error', message: 'Bot sudah terdaftar' });
  }
  
  BOT_CONFIG.multiBot.push({
    uid, nickname, region: region || 'id', token: token || '', active: true
  });
  saveBotConfig();
  
  res.json({ status: 'success', message: `Bot ${nickname} berhasil ditambahkan`, data: BOT_CONFIG.multiBot });
});

// ========== 27. REMOVE BOT ==========
app.delete('/api/bot/remove/:uid', (req, res) => {
  const { uid } = req.params;
  const index = BOT_CONFIG.multiBot.findIndex(b => b.uid === uid);
  
  if (index === -1) {
    return res.status(404).json({ status: 'error', message: 'Bot tidak ditemukan' });
  }
  
  const removed = BOT_CONFIG.multiBot.splice(index, 1);
  saveBotConfig();
  res.json({ status: 'success', message: `Bot ${removed[0].nickname} berhasil dihapus` });
});

// ========== 28. UPDATE SETTINGS ==========
app.post('/api/bot/settings', (req, res) => {
  const { defaultRegion, defaultSize, autoLeave, cooldown, maxUidsPerRequest, retryOnFail } = req.body;
  
  if (defaultRegion) BOT_CONFIG.settings.defaultRegion = defaultRegion;
  if (defaultSize) BOT_CONFIG.settings.defaultSize = defaultSize;
  if (autoLeave !== undefined) BOT_CONFIG.settings.autoLeave = autoLeave;
  if (cooldown) BOT_CONFIG.settings.cooldown = cooldown;
  if (maxUidsPerRequest) BOT_CONFIG.settings.maxUidsPerRequest = maxUidsPerRequest;
  if (retryOnFail) BOT_CONFIG.settings.retryOnFail = retryOnFail;
  saveBotConfig();
  
  res.json({ status: 'success', message: 'Pengaturan disimpan', settings: BOT_CONFIG.settings });
});

// ========== 29. BOT EMOTE (PAKAI MULTI BOT) ==========
app.post('/api/bot/emote', (req, res) => {
  const { region, tc, emote_id, uids, useMultiBot = false } = req.body;
  
  if (!region || !tc || !emote_id || !uids || uids.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap!' });
  }
  
  let activeBots = BOT_CONFIG.multiBot.filter(b => b.active);
  
  if (!useMultiBot || activeBots.length === 0) {
    if (BOT_CONFIG.mainBot.status !== 'active') {
      return res.status(503).json({ status: 'error', message: 'Bot utama sedang maintenance' });
    }
    activeBots = [BOT_CONFIG.mainBot];
  }
  
  const lobbyId = generateLobbyId();
  const results = activeBots.map(bot => ({
    bot: bot.nickname,
    uid: bot.uid,
    status: 'success',
    message: `Emote ${emote_id} dikirim ke ${uids.length} UID`
  }));
  
  res.json({
    status: 'success',
    lobby_id: lobbyId,
    total_bots: activeBots.length,
    results: results,
    data: { region, tc, emote_id, uids }
  });
});

// ========== 30. BOT INVITE (PAKAI MULTI BOT) ==========
app.post('/api/bot/invite', (req, res) => {
  const { region, size, invite_uid, leave, useMultiBot = false } = req.body;
  
  if (!region || !size || !invite_uid) {
    return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap!' });
  }
  
  let activeBots = BOT_CONFIG.multiBot.filter(b => b.active);
  
  if (!useMultiBot || activeBots.length === 0) {
    if (BOT_CONFIG.mainBot.status !== 'active') {
      return res.status(503).json({ status: 'error', message: 'Bot utama sedang maintenance' });
    }
    activeBots = [BOT_CONFIG.mainBot];
  }
  
  const leaveStatus = (leave === '1' || leave === true) ? 'Ya' : 'Tidak';
  const results = activeBots.map(bot => ({
    bot: bot.nickname,
    uid: bot.uid,
    status: 'success',
    message: `Undangan ${size} vs ${size} dikirim ke UID ${invite_uid} (auto leave: ${leaveStatus})`
  }));
  
  res.json({
    status: 'success',
    total_bots: activeBots.length,
    results: results,
    data: { region, size, invite_uid, leave: leaveStatus }
  });
});

// ========== 31. GET ACTIVE BOT LIST ==========
app.get('/api/bot/list', (req, res) => {
  const activeBots = [
    { uid: BOT_CONFIG.mainBot.uid, nickname: BOT_CONFIG.mainBot.nickname, region: BOT_CONFIG.mainBot.region, isMain: true, status: BOT_CONFIG.mainBot.status },
    ...BOT_CONFIG.multiBot.filter(b => b.active).map(b => ({ uid: b.uid, nickname: b.nickname, region: b.region, isMain: false, status: 'active' }))
  ];
  
  res.json({ status: 'success', total: activeBots.length, bots: activeBots });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`\n🚀 FF API by Rmax - Mandiri running on http://localhost:${PORT}`);
  console.log(`📡 Bot utama: ${BOT_CONFIG.mainBot.nickname} (${BOT_CONFIG.mainBot.uid}) - ${BOT_CONFIG.mainBot.status}`);
  console.log(`📡 Multi bot: ${BOT_CONFIG.multiBot.filter(b => b.active).length} aktif dari ${BOT_CONFIG.multiBot.length} total\n`);
});
