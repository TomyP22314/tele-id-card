// index.js - Versi minimal pasti respon (tes webhook Telegraf + Render)

require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
  console.error('ERROR: BOT_TOKEN tidak ada di environment variables!');
  process.exit(1);
}

console.log('Token ditemukan, mulai inisialisasi bot...');

const bot = new Telegraf(TOKEN);

const app = express();

// WAJIB: Parse JSON body dari Telegram webhook
app.use(express.json());

// Log setiap request masuk (penting untuk debug)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Route tes (buka di browser untuk wake up service)
app.get('/', (req, res) => {
  res.send('Bot sedang hidup! Coba kirim /start di Telegram.');
});

// Handler /start - versi super sederhana
bot.start(async (ctx) => {
  console.log('Handler /start dipanggil oleh user:', ctx.from.id);

  try {
    const user = ctx.from;
    const name = user.first_name || 'Pengguna';
    const premium = user.is_premium ? 'Ya (Premium)' : 'Tidak';

    await ctx.reply(
      `Halo ${name}! 👋\n` +
      `Bot sudah menerima pesanmu.\n` +
      `User ID kamu: ${user.id}\n` +
      `Premium: ${premium}\n\n` +
      `Tes sukses! Bot respon normal.`
    );

    console.log('Reply /start berhasil dikirim');
  } catch (err) {
    console.error('Gagal kirim reply /start:', err.message);
  }
});

// Handler tes lain (kirim /ping)
bot.command('ping', async (ctx) => {
  await ctx.reply('Pong! Bot hidup dan bisa kirim pesan.');
});

// Path webhook rahasia (pakai bagian token biar unik & aman)
const tokenPart = TOKEN.split(':')[1] || 'secret';
const webhookPath = `/webhook/${tokenPart}`;

// Pasang Telegraf di path itu
app.use(webhookPath, bot.webhookCallback(webhookPath));

// Jalankan server
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server berjalan di port ${PORT}`);

  const hostname = process.env.RENDER_EXTERNAL_HOSTNAME || `localhost:${PORT}`;
  const webhookUrl = `https://${hostname}${webhookPath}`;

  try {
    // Drop antrian lama supaya bersih
    await bot.telegram.setWebhook(webhookUrl, { drop_pending_updates: true });
    console.log(`Webhook berhasil diset ke: ${webhookUrl}`);
  } catch (err) {
    console.error('Gagal set webhook:', err.message || err);
  }
});

// Error handling dasar
process.on('uncaughtException', err => {
  console.error('CRASH (uncaught):', err);
});

process.on('unhandledRejection', reason => {
  console.error('Unhandled rejection:', reason);
});

console.log('File index.js selesai di-load');
