// index.js - MINIMAL VERSION PASTI RESPON (no canvas, focus webhook + reply teks)

require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
  console.error('CRITICAL: BOT_TOKEN TIDAK ADA DI ENV!');
  process.exit(1);
}

console.log('Token OK. Mulai setup bot...');

const bot = new Telegraf(TOKEN);

const app = express();

// Parse JSON body dari Telegram (WAJIB!)
app.use(express.json());

// Log SEMUA request masuk + body full (debug utama)
app.use((req, res, next) => {
  console.log(`\n=== REQUEST MASUK [${new Date().toISOString()}] ===`);
  console.log(`${req.method} ${req.url}`);
  console.log('IP:', req.ip);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Route tes browser
app.get('/', (req, res) => {
  res.send('Bot LIVE! Kirim /start atau /ping di Telegram.');
});

// Handler /start - SUPER SEDERHANA + LOG EKSTRA
bot.start(async (ctx) => {
  console.log('>>> HANDLER START DIPANGGIL <<<');
  console.log('User:', JSON.stringify(ctx.from, null, 2));

  try {
    const name = ctx.from.first_name || 'User';
    const id = ctx.from.id;
    const premium = ctx.from.is_premium ? 'Ya' : 'Tidak';

    console.log('Mencoba kirim reply...');

    await ctx.reply(
      `Halo ${name}! Bot sudah terima /start kamu.\n` +
      `User ID: ${id}\n` +
      `Premium: ${premium}\n\n` +
      `Respon ini dari server Render. Kalau muncul, bot OK!`
    );

    console.log('>>> REPLY SUKSES DIKIRIM <<<');
  } catch (err) {
    console.error('GAGAL KIRIM REPLY:', err.message || err);
  }
});

// Handler tes /ping
bot.command('ping', async (ctx) => {
  console.log('Handler /ping dipanggil');
  try {
    await ctx.reply('Pong! Bot bisa kirim pesan.');
    console.log('Ping reply sukses');
  } catch (err) {
    console.error('Gagal ping reply:', err.message);
  }
});

// Path webhook rahasia
const tokenPart = TOKEN.split(':')[1] || 'secret';
const webhookPath = `/hook/${tokenPart}`;  // contoh /hook/ABC-DEF...

// Pasang webhook
app.use(webhookPath, bot.webhookCallback(webhookPath));

// Server start
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server jalan port ${PORT}`);

  const hostname = process.env.RENDER_EXTERNAL_HOSTNAME || `localhost:${PORT}`;
  const webhookUrl = `https://${hostname}${webhookPath}`;

  try {
    await bot.telegram.setWebhook(webhookUrl, { drop_pending_updates: true });
    console.log(`Webhook SET: ${webhookUrl}`);
  } catch (err) {
    console.error('Gagal set webhook:', err.message || err);
  }
});

console.log('Script selesai load');
