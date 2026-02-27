// index.js - VERSI PASTI RESPON (minimal + debug full)

require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
  console.error('ERROR: BOT_TOKEN TIDAK ADA!');
  process.exit(1);
}

console.log('Token OK. Setup bot...');

const bot = new Telegraf(TOKEN);

// Debug: Log setiap update yang masuk ke Telegraf
bot.use(async (ctx, next) => {
  console.log('>>> UPDATE MASUK KE TELEGRAF MIDDLEWARE <<<');
  console.log('Update type:', ctx.updateType);
  console.log('Message text:', ctx.message?.text || 'Tidak ada');
  console.log('From user:', ctx.from?.id || 'Tidak ada');
  await next();
  console.log('>>> NEXT DIPANGGIL <<<');
});

// Handler /start - sederhana sekali
bot.start(async (ctx) => {
  console.log('>>> HANDLER bot.start() DIPANGGIL! <<<');

  try {
    await ctx.reply('Halo! Bot sudah terima /start kamu. Ini respon tes dari server.');
    console.log('>>> REPLY SUKSES DIKIRIM <<<');
  } catch (err) {
    console.error('Gagal reply:', err.message || err);
  }
});

// Handler semua text (backup kalau command tidak match)
bot.on('text', async (ctx) => {
  console.log('>>> TEXT HANDLER DIPANGGIL (backup) <<<');
  await ctx.reply('Kamu kirim teks: ' + ctx.message.text);
});

// Handler tes /ping
bot.command('ping', async (ctx) => {
  console.log('>>> /ping DIPANGGIL <<<');
  await ctx.reply('Pong!');
});

// Setup Express
const app = express();

// WAJIB parse JSON
app.use(express.json());

// Log request masuk
app.use((req, res, next) => {
  console.log(`\n=== REQUEST [${new Date().toISOString()}] ${req.method} ${req.url} ===`);
  next();
});

// Path webhook sederhana (ubah kalau mau lebih aman)
const webhookPath = '/webhook';

// Pasang Telegraf di path itu
app.use(webhookPath, bot.webhookCallback(webhookPath));

app.get('/', (req, res) => {
  res.send('Bot OK! Kirim /start di Telegram.');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server jalan di port ${PORT}`);

  const hostname = process.env.RENDER_EXTERNAL_HOSTNAME || `localhost:${PORT}`;
  const webhookUrl = `https://${hostname}${webhookPath}`;

  try {
    await bot.telegram.setWebhook(webhookUrl, { drop_pending_updates: true });
    console.log(`Webhook SET: ${webhookUrl}`);
  } catch (err) {
    console.error('Gagal set webhook:', err.message || err);
  }
});

console.log('Script loaded');
