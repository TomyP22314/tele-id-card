require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
  console.error('ERROR: BOT_TOKEN tidak ada!');
  process.exit(1);
}

const bot = new Telegraf(TOKEN);

// Log setiap update yang masuk ke Telegraf (wajib debug)
bot.use((ctx, next) => {
  console.log('UPDATE TELEGRAF DITERIMA!');
  console.log('Update type:', ctx.updateType);
  if (ctx.message) {
    console.log('Pesan:', ctx.message.text);
    console.log('Dari user:', ctx.from.id);
  }
  return next();
});

// Handler /start paling sederhana
bot.start((ctx) => {
  console.log('bot.start() TERPANGGIL!');
  ctx.reply('Halo! Bot sudah terima /start. Ini respon tes.');
  console.log('Reply dikirim');
});

// Handler semua pesan (backup)
bot.on('message', (ctx) => {
  console.log('Pesan apa saja diterima');
  ctx.reply('Kamu kirim: ' + (ctx.message.text || 'tidak ada teks'));
});

// Express
const app = express();
app.use(express.json());

// Log request
app.use((req, res, next) => {
  console.log(`REQUEST: ${req.method} ${req.url}`);
  next();
});

// Path webhook
const webhookPath = '/webhook';

// Pasang webhook
app.use(webhookPath, bot.webhookCallback(webhookPath));

app.get('/', (req, res) => {
  res.send('Bot OK!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server jalan port ${PORT}`);

  const webhookUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}${webhookPath}`;

  try {
    await bot.telegram.setWebhook(webhookUrl, { drop_pending_updates: true });
    console.log(`Webhook set: ${webhookUrl}`);
  } catch (err) {
    console.error('Gagal set webhook:', err.message);
  }
});
