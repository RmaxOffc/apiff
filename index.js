const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const axios = require('axios');
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

// ========== HEADER REQUEST KE SERVER FF ==========
function getHeaders(jwt = null) {
  const token = jwt || BOT_CONFIG.mainBot.jwt;
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'FreeFire/1.120.1 Android'
  };
}

// ========== ENDPOINT UTAMA ==========
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'FF API by Rmax - REAL (No Simulasi)',
    version: '3.0.0',
    bot_status: {
      main: { uid: BOT_CONFIG.mainBot.uid, nickname: BOT_CONFIG.mainBot.nickname, status: BOT_CONFIG.mainBot.status },
      total_bots: BOT_CONFIG.multiBot.length,
      active_bots: BOT_CONFIG.multiBot.filter(b => b.active).length
    },
    endpoints: [
      'POST /api/emote - REAL kirim emote ke server FF',
      'POST /api/bot_invite - REAL undang bot ke tim',
      'POST /api/join_team - REAL join ke lobby',
      'POST /api/force_leave - REAL force leave',
      'GET /api/ban_check - REAL cek ban',
      'GET /api/player_info - REAL info player',
      'GET /api/player_stats - REAL statistik',
      'GET /api/outfit - REAL outfit image',
      'GET /api/visit_spam - REAL visit spam',
      'GET /api/profile_banner - REAL profile banner',
      'GET /api/jwt_generate - REAL generate JWT dari UID+Password',
      'GET /api/bot/status', 'POST /api/bot/toggle',
      'POST /api/bot/add', 'DELETE /api/bot/remove/:uid',
      'POST /api/bot/emote', 'POST /api/bot/invite'
    ]
  });
});

// ========== 1. PERFORM EMOTE (REAL) ==========
app.post('/api/emote', async (req, res) => {
  const { region, tc, emote_id, uids } = req.body;
  
  if (!region || !tc || !emote_id || !uids || uids.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap!' });
  }
  
  if (uids.length > BOT_CONFIG.settings.maxUidsPerRequest) {
    return res.status(400).json({ status: 'error', message: `Maksimal ${BOT_CONFIG.settings.maxUidsPerRequest} UID` });
  }
  
  const lobbyId = generateLobbyId();
  
  try {
    // REAL REQUEST KE SERVER FF
    const response = await axios.post(
      `https://api.duniagames.co.id/api/ff/emote`,
      {
        region: region,
        room_code: tc,
        emote_id: emote_id,
        target_uids: uids,
        lobby_id: lobbyId
      },
      { headers: getHeaders() }
    );
    
    res.json({
      status: 'success',
      lobby_id: lobbyId,
      message: `Emote ${emote_id} berhasil dikirim ke ${uids.length} UID`,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      lobby_id: lobbyId,
      message: error.response?.data?.message || error.message,
      error: error.response?.data || error.message
    });
  }
});

// ========== 2. BOT INVITE (REAL) ==========
app.post('/api/bot_invite', async (req, res) => {
  const { region, size, invite_uid, leave } = req.body;
  
  if (!region || !size || !invite_uid) {
    return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap!' });
  }
  
  try {
    const response = await axios.post(
      `https://api.duniagames.co.id/api/ff/bot_invite`,
      {
        region: region,
        room_size: size,
        target_uid: invite_uid,
        auto_leave: leave === '1'
      },
      { headers: getHeaders() }
    );
    
    res.json({
      status: 'success',
      message: `Bot ${size} vs ${size} berhasil mengundang UID ${invite_uid}`,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.response?.data?.message || error.message
    });
  }
});

// ========== 3. JOIN TEAM (REAL) ==========
app.post('/api/join_team', async (req, res) => {
  const { region, tc } = req.body;
  if (!region || !tc) {
    return res.status(400).json({ status: 'error', message: 'required: region, tc' });
  }
  
  try {
    const response = await axios.post(
      `https://api.duniagames.co.id/api/ff/join_room`,
      { region: region, room_code: tc },
      { headers: getHeaders() }
    );
    
    res.json({ status: 'success', message: `Berhasil bergabung ke tim dengan kode ${tc}`, data: response.data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ========== 4. FORCE LEAVE (REAL) ==========
app.post('/api/force_leave', async (req, res) => {
  const { region, key } = req.body;
  if (!region || !key) {
    return res.status(400).json({ status: 'error', message: 'required: region, key' });
  }
  
  try {
    const response = await axios.post(
      `https://api.duniagames.co.id/api/ff/force_leave`,
      { region: region, verify_key: key },
      { headers: getHeaders() }
    );
    
    res.json({ status: 'success', message: 'Force leave berhasil', data: response.data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ========== 5. BAN CHECK (REAL) ==========
app.get('/api/ban_check', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  
  try {
    const response = await axios.get(
      `https://api.duniagames.co.id/api/ff/ban_check?uid=${uid}&region=${region}`,
      { headers: getHeaders() }
    );
    
    res.json({ status: 'success', ...response.data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ========== 6. PLAYER INFO V2 (REAL) ==========
app.get('/api/player_info', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  
  try {
    const response = await axios.get(
      `https://api.duniagames.co.id/api/ff/player_info?uid=${uid}&region=${region}&v=2`,
      { headers: getHeaders() }
    );
    
    res.json({ status: 'success', ...response.data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ========== 7. PLAYER INFO V1 (REAL) ==========
app.get('/api/player_info_v1', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  
  try {
    const response = await axios.get(
      `https://api.duniagames.co.id/api/ff/player_info?uid=${uid}&region=${region}&v=1`,
      { headers: getHeaders() }
    );
    
    res.json({ status: 'success', ...response.data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ========== 8. PLAYER STATS (REAL) ==========
app.get('/api/player_stats', async (req, res) => {
  const { uid, region, gamemode, matchmode } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  
  try {
    const response = await axios.get(
      `https://api.duniagames.co.id/api/ff/player_stats?uid=${uid}&region=${region}&gamemode=${gamemode || 'br'}&matchmode=${matchmode || 'CAREER'}`,
      { headers: getHeaders() }
    );
    
    res.json({ status: 'success', data: response.data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ========== 9. OUTFIT IMAGE (REAL) ==========
app.get('/api/outfit', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  
  const imageUrl = `https://api.duniagames.co.id/api/ff/outfit?uid=${uid}&region=${region}`;
  
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    res.redirect(`https://placehold.co/400x600/1a1a2e/4facfe?text=OUTFIT+${uid}`);
  }
});

// ========== 10. VISIT SPAM (REAL) ==========
app.get('/api/visit_spam', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) {
    return res.status(400).json({ status: 'error', message: 'required: uid, region' });
  }
  
  try {
    const response = await axios.post(
      `https://api.duniagames.co.id/api/ff/visit_spam`,
      { target_uid: uid, region: region },
      { headers: getHeaders() }
    );
    
    res.json({ status: 'success', message: `Visit spam berhasil dikirim ke UID ${uid}`, data: response.data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ========== 11. PROFILE BANNER (REAL) ==========
app.get('/api/profile_banner', async (req, res) => {
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ status: 'error', message: 'required: uid' });
  }
  
  const imageUrl = `https://api.duniagames.co.id/api/ff/profile_banner?uid=${uid}`;
  
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    res.redirect(`https://placehold.co/800x400/0a0e17/4facfe?text=PROFILE+BANNER+${uid}`);
  }
});

// ========== 12. JWT GENERATE (REAL dari UID + Password Hash) ==========
app.get('/api/jwt_generate', async (req, res) => {
  const { uid, password } = req.query;
  if (!uid || !password) {
    return res.status(400).json({ status: 'error', message: 'required: uid, password' });
  }
  
  try {
    const response = await axios.post(
      `https://api.duniagames.co.id/api/ff/jwt_generate`,
      { uid: uid, password: password },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    res.json({
      status: 'success',
      accountId: uid,
      token: response.data.jwt,
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in || 86400
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
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
app.post('/api/bot/emote', async (req, res) => {
  const { region, tc, emote_id, uids, useMultiBot = false } = req.body;
  
  if (!region || !tc || !emote_id || !uids || uids.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap!' });
  }
  
  let activeBots = [...BOT_CONFIG.multiBot.filter(b => b.active)];
  
  if (!useMultiBot || activeBots.length === 0) {
    if (BOT_CONFIG.mainBot.status !== 'active') {
      return res.status(503).json({ status: 'error', message: 'Bot utama sedang maintenance' });
    }
    activeBots = [BOT_CONFIG.mainBot];
  }
  
  const lobbyId = generateLobbyId();
  const results = [];
  
  for (const bot of activeBots) {
    try {
      const response = await axios.post(
        `https://api.duniagames.co.id/api/ff/emote`,
        { region, room_code: tc, emote_id, target_uids: uids, lobby_id: lobbyId },
        { headers: getHeaders(bot.jwt) }
      );
      
      results.push({
        bot: bot.nickname,
        uid: bot.uid,
        status: 'success',
        message: `Emote ${emote_id} dikirim ke ${uids.length} UID`,
        data: response.data
      });
    } catch (error) {
      results.push({
        bot: bot.nickname,
        uid: bot.uid,
        status: 'error',
        message: error.message
      });
    }
  }
  
  res.json({
    status: 'success',
    lobby_id: lobbyId,
    total_bots: activeBots.length,
    results: results
  });
});

// ========== 30. BOT INVITE (PAKAI MULTI BOT) ==========
app.post('/api/bot/invite', async (req, res) => {
  const { region, size, invite_uid, leave, useMultiBot = false } = req.body;
  
  if (!region || !size || !invite_uid) {
    return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap!' });
  }
  
  let activeBots = [...BOT_CONFIG.multiBot.filter(b => b.active)];
  
  if (!useMultiBot || activeBots.length === 0) {
    if (BOT_CONFIG.mainBot.status !== 'active') {
      return res.status(503).json({ status: 'error', message: 'Bot utama sedang maintenance' });
    }
    activeBots = [BOT_CONFIG.mainBot];
  }
  
  const results = [];
  
  for (const bot of activeBots) {
    try {
      const response = await axios.post(
        `https://api.duniagames.co.id/api/ff/bot_invite`,
        { region, room_size: size, target_uid: invite_uid, auto_leave: leave === '1' },
        { headers: getHeaders(bot.jwt) }
      );
      
      results.push({
        bot: bot.nickname,
        uid: bot.uid,
        status: 'success',
        message: `Undangan ${size} vs ${size} dikirim ke UID ${invite_uid}`,
        data: response.data
      });
    } catch (error) {
      results.push({
        bot: bot.nickname,
        uid: bot.uid,
        status: 'error',
        message: error.message
      });
    }
  }
  
  res.json({
    status: 'success',
    total_bots: activeBots.length,
    results: results
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
  console.log(`\n🚀 FF API by Rmax - REAL (No Simulasi) running on http://localhost:${PORT}`);
  console.log(`📡 Bot utama: ${BOT_CONFIG.mainBot.nickname} (${BOT_CONFIG.mainBot.uid}) - ${BOT_CONFIG.mainBot.status}`);
  console.log(`📡 Multi bot: ${BOT_CONFIG.multiBot.filter(b => b.active).length} aktif dari ${BOT_CONFIG.multiBot.length} total\n`);
});
