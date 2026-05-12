const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ========== KONFIGURASI BOT LO ==========
const BOT_CONFIG = {
  mainBot: {
    uid: "4815713429",
    nickname: "THISISBOTRMX",
    region: "id",
    jwt: "eyJhbGciOiJIUzI1NiIsInN2ciI6IjEiLCJ0eXAiOiJKV1QifQ.eyJhY2NvdW50X2lkIjoxNTY3NTA2OTIzOCwibmlja25hbWUiOiJaUzE4YTNCcklTdzJhaWsrIiwibm90aV9yZWdpb24iOiJJRCIsImxvY2tfcmVnaW9uIjoiSUQiLCJleHRlcm5hbF9pZCI6IjE4YmJmODU4ZGZhOTE1MGY2OTljNmZjZDlhMGNkMjk3IiwiZXh0ZXJuYWxfdHlwZSI6NCwicGxhdF9pZCI6MSwiY2xpZW50X3ZlcnNpb24iOiIxLjEyMC4xIiwiZW11bGF0b3Jfc2NvcmUiOjEwMCwiaXNfZW11bGF0b3IiOnRydWUsImNvdW50cnlfY29kZSI6IlVTIiwiZXh0ZXJuYWxfdWlkIjo0ODE1NzEzNDI5LCJyZWdfYXZhdGFyIjoxMDIwMDAwMDcsInNvdXJjZSI6NCwibG9ja19yZWdpb25fdGltZSI6MTc3ODU2ODQ3MCwiY2xpZW50X3R5cGUiOjIsInNpZ25hdHVyZV9tZDUiOiIiLCJ1c2luZ192ZXJzaW9uIjoxLCJyZWxlYXNlX2NoYW5uZWwiOiIzcmRfcGFydHkiLCJyZWxlYXNlX3ZlcnNpb24iOiJPQjUzIiwiZXhwIjoxNzc4NjAxNjM3fQ.Uwf5oW345tzBTpi8GzKDocewTsWrt3KyW2YMrLzctpM",
    status: "active"
  }
};

// ========== FUNGSI HEADER REQUEST KE SERVER FF ==========
function getFFHeaders(jwt = null) {
  const token = jwt || BOT_CONFIG.mainBot.jwt;
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'FreeFire/1.120.1 Android',
    'X-Requested-With': 'com.dts.freefireth'
  };
}

// ========== 1. PERFORM EMOTE ==========
app.post('/api/emote', async (req, res) => {
  const { region, tc, emote_id, uids } = req.body;

  if (!region || !tc || !emote_id || !uids || uids.length === 0) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Parameter kurang! Butuh: region, tc, emote_id, uids (array)' 
    });
  }

  const lobbyId = `LBY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  try {
    // KIRIM KE SERVER FF PAKE JWT
    const response = await axios.post(
      `https://api.duniagames.co.id/api/ff/emote`, // GANTI PAKE ENDPOINT REAL
      {
        region: region,
        room_code: tc,
        emote_id: parseInt(emote_id),
        target_uids: uids,
        lobby_id: lobbyId
      },
      { headers: getFFHeaders() }
    );

    res.json({
      status: 'success',
      lobby_id: lobbyId,
      message: `Emote ${emote_id} berhasil dikirim ke ${uids.length} UID`,
      data: response.data
    });
  } catch (error) {
    res.json({
      status: 'error',
      lobby_id: lobbyId,
      message: error.response?.data?.message || error.message
    });
  }
});

// ========== 2. BOT INVITE ==========
app.post('/api/bot_invite', async (req, res) => {
  const { region, size, invite_uid, leave } = req.body;

  if (!region || !size || !invite_uid) {
    return res.status(400).json({ status: 'error', message: 'Parameter kurang!' });
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
      { headers: getFFHeaders() }
    );

    res.json({
      status: 'success',
      message: `Bot ${size} vs ${size} berhasil mengundang UID ${invite_uid}`,
      data: response.data
    });
  } catch (error) {
    res.json({ status: 'error', message: error.message });
  }
});

// ========== 3. JOIN TEAM ==========
app.post('/api/join_team', async (req, res) => {
  const { region, tc } = req.body;
  if (!region || !tc) return res.status(400).json({ status: 'error', message: 'Parameter kurang!' });

  try {
    const response = await axios.post(
      `https://api.duniagames.co.id/api/ff/join_room`,
      { region, room_code: tc },
      { headers: getFFHeaders() }
    );
    res.json({ status: 'success', data: response.data });
  } catch (error) {
    res.json({ status: 'error', message: error.message });
  }
});

// ========== 4. FORCE LEAVE ==========
app.post('/api/force_leave', async (req, res) => {
  const { region, key } = req.body;
  if (!region || !key) return res.status(400).json({ status: 'error', message: 'Parameter kurang!' });

  try {
    const response = await axios.post(
      `https://api.duniagames.co.id/api/ff/force_leave`,
      { region, verify_key: key },
      { headers: getFFHeaders() }
    );
    res.json({ status: 'success', data: response.data });
  } catch (error) {
    res.json({ status: 'error', message: error.message });
  }
});

// ========== 5. BAN CHECK ==========
app.get('/api/ban_check', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) return res.status(400).json({ status: 'error', message: 'Parameter kurang!' });

  try {
    const response = await axios.get(
      `https://api.duniagames.co.id/api/ff/ban_check?uid=${uid}&region=${region}`,
      { headers: getFFHeaders() }
    );
    res.json({ status: 'success', ...response.data });
  } catch (error) {
    res.json({ status: 'error', message: error.message });
  }
});

// ========== 6. PLAYER INFO V2 ==========
app.get('/api/player_info', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) return res.status(400).json({ status: 'error', message: 'Parameter kurang!' });

  try {
    const response = await axios.get(
      `https://api.duniagames.co.id/api/ff/player_info?uid=${uid}&region=${region}&v=2`,
      { headers: getFFHeaders() }
    );
    res.json({ status: 'success', ...response.data });
  } catch (error) {
    res.json({ status: 'error', message: error.message });
  }
});

// ========== 7. PLAYER INFO V1 ==========
app.get('/api/player_info_v1', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) return res.status(400).json({ status: 'error', message: 'Parameter kurang!' });

  try {
    const response = await axios.get(
      `https://api.duniagames.co.id/api/ff/player_info?uid=${uid}&region=${region}&v=1`,
      { headers: getFFHeaders() }
    );
    res.json({ status: 'success', ...response.data });
  } catch (error) {
    res.json({ status: 'error', message: error.message });
  }
});

// ========== 8. PLAYER STATS ==========
app.get('/api/player_stats', async (req, res) => {
  const { uid, region, gamemode, matchmode } = req.query;
  if (!uid || !region) return res.status(400).json({ status: 'error', message: 'Parameter kurang!' });

  try {
    const response = await axios.get(
      `https://api.duniagames.co.id/api/ff/player_stats?uid=${uid}&region=${region}&gamemode=${gamemode || 'br'}&matchmode=${matchmode || 'CAREER'}`,
      { headers: getFFHeaders() }
    );
    res.json({ status: 'success', data: response.data });
  } catch (error) {
    res.json({ status: 'error', message: error.message });
  }
});

// ========== 9. OUTFIT IMAGE (GAMBAR LANGSUNG) ==========
app.get('/api/outfit', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) return res.status(400).json({ status: 'error', message: 'Parameter kurang!' });

  const imageUrl = `https://api.duniagames.co.id/api/ff/outfit?uid=${uid}&region=${region}`;
  
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    res.redirect(`https://placehold.co/400x600/1a1a2e/4facfe?text=OUTFIT+${uid}`);
  }
});

// ========== 10. VISIT SPAM ==========
app.get('/api/visit_spam', async (req, res) => {
  const { uid, region } = req.query;
  if (!uid || !region) return res.status(400).json({ status: 'error', message: 'Parameter kurang!' });

  try {
    const response = await axios.post(
      `https://api.duniagames.co.id/api/ff/visit_spam`,
      { target_uid: uid, region },
      { headers: getFFHeaders() }
    );
    res.json({ status: 'success', data: response.data });
  } catch (error) {
    res.json({ status: 'error', message: error.message });
  }
});

// ========== 11. PROFILE BANNER ==========
app.get('/api/profile_banner', async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ status: 'error', message: 'Parameter kurang!' });

  const imageUrl = `https://api.duniagames.co.id/api/ff/profile_banner?uid=${uid}`;
  
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    res.redirect(`https://placehold.co/800x400/0a0e17/4facfe?text=PROFILE+BANNER+${uid}`);
  }
});

// ========== 12. CEK STATUS BOT ==========
app.get('/api/bot/status', (req, res) => {
  res.json({
    status: 'success',
    data: {
      uid: BOT_CONFIG.mainBot.uid,
      nickname: BOT_CONFIG.mainBot.nickname,
      region: BOT_CONFIG.mainBot.region,
      status: BOT_CONFIG.mainBot.status,
      jwt_available: !!BOT_CONFIG.mainBot.jwt
    }
  });
});

// ========== ROOT ==========
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'FF API by Rmax - Mandiri',
    endpoints: [
      'POST /api/emote', 'POST /api/bot_invite', 'POST /api/join_team', 'POST /api/force_leave',
      'GET /api/ban_check', 'GET /api/player_info', 'GET /api/player_info_v1', 'GET /api/player_stats',
      'GET /api/outfit', 'GET /api/visit_spam', 'GET /api/profile_banner',
      'GET /api/bot/status'
    ]
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 FF API Mandiri running on http://localhost:${PORT}`);
  console.log(`📡 Bot utama: ${BOT_CONFIG.mainBot.nickname} (${BOT_CONFIG.mainBot.uid})`);
});
