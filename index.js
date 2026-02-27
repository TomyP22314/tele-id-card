require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
  console.error('ERROR: BOT_TOKEN tidak ada di env!');
  process.exit(1);
}

console.log('Token ditemukan. Mulai setup...');

const bot = new Telegraf(TOKEN);

// Middleware global Telegraf: log setiap update yang masuk
bot.use((ctx, next) => {
  console.log('>>> UPDATE DITERIMA OLEH TELEGRAF <<<');
  console.log('Update type:', ctx.updateType);
  if (ctx.message) {
    console.log('Message text:', ctx.message.text);
    console.log('From user ID:', ctx.from.id);
  }
  return next().then(() => {
    console.log('>>> NEXT SELESAI <<<');
  }).catch(err => {
    console.error('Error di middleware:', err);
  });
});

// Handler /start sederhana
bot.start(async (ctx) => {
  console.log('>>> bot.start() TER-TRIGGER! <<<');
  try {
    await ctx.reply('Halo! Bot sudah terima /start. Ini tes respon teks sederhana.');
    console.log('>>> REPLY /start SUKSES <<<');
  } catch (err) {
    console.error('Gagal reply /start:', err.message);
  }
});

// Handler semua pesan text (backup kalau command tidak match)
bot.on('text', async (ctx) => {
  console.log('>>> TEXT HANDLER (backup) <<<');
  await ctx.reply('Kamu kirim: ' + ctx.message.text);
});

// Handler /ping tes
bot.command('ping', async (ctx) => {
  console.log('>>> /ping TER-TRIGGER <<<');
  await ctx.reply('Pong!');
});

// Express setup
const app = express();

// Parse JSON WAJIB
app.use(express.json());

// Log request
app.use((req, res, next) => {
  console.log(`\n=== REQUEST MASUK [${new Date().toISOString()}] ${req.method} ${req.url} ===`);
  next();
});

// Path webhook sederhana (ubah kalau konflik)
const webhookPath = '/webhook';

// Pasang webhook Telegraf
app.use(webhookPath, bot.webhookCallback(webhookPath));

app.get('/', (req, res) => {
  res.send('Bot hidup! Coba /start di Telegram.');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server jalan di port ${PORT}`);

  const hostname = process.env.RENDER_EXTERNAL_HOSTNAME || `localhost:${PORT}`;
  const webhookUrl = `https://${hostname}${webhookPath}`;

  try {
    await bot.telegram.setWebhook(webhookUrl, { drop_pending_updates: true });
    console.log(`Webhook set sukses: ${webhookUrl}`);
  } catch (err) {
    console.error('Gagal set webhook:', err.message);
  }
});

console.log('Script loaded');
