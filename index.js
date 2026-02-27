// index.js
require('dotenv').config();
const { Telegraf } = require('telegraf');
const { createCanvas, loadImage } = require('canvas');
const express = require('express');
const fetch = require('node-fetch'); // untuk download foto profile

const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
  console.error('ERROR: BOT_TOKEN tidak ditemukan di environment variables');
  process.exit(1);
}

const bot = new Telegraf(TOKEN);

// ... (bagian atas: requires, TOKEN check, bot = new Telegraf(TOKEN) tetap)

const app = express();

// WAJIB: Parse JSON dari Telegram
app.use(express.json());

// Log SEMUA request (debug super penting!)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} dari IP ${req.ip}`);
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    next();
});

// Route tes (buka browser untuk wake up)
app.get('/', (req, res) => {
    res.send('Bot ID Card LIVE! Coba /start di Telegram.');
});

// Path webhook RAHASIA (pakai bagian token biar unik)
const tokenParts = TOKEN.split(':');
const secretPath = `/bot-hook/${tokenParts[1] || 'default'}`;  // contoh: /bot-hook/ABC-DEF123...

// Mount Telegraf di path itu
app.use(secretPath, bot.webhookCallback(secretPath));

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server jalan di port ${PORT}`);

    const hostname = process.env.RENDER_EXTERNAL_HOSTNAME || `localhost:${PORT}`;
    const webhookUrl = `https://${hostname}${secretPath}`;

    try {
        // Drop antrian lama + set webhook baru
        await bot.telegram.setWebhook(webhookUrl, { drop_pending_updates: true });
        console.log(`Webhook SET SUKSES: ${webhookUrl}`);
    } catch (err) {
        console.error('Gagal set webhook:', err.message || err);
    }
});

// Global error log
process.on('uncaughtException', err => console.error('CRASH:', err));
process.on('unhandledRejection', reason => console.error('Reject:', reason));

// Handler /start
bot.start(async (ctx) => {
  try {
    const user = ctx.from;
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
    const username = user.username ? `@${user.username}` : 'Tidak ada';
    const userId = user.id;
    const isPremium = user.is_premium ? 'Ya' : 'Tidak';

    // Ambil foto profile (jika ada)
    let profilePhotoUrl = null;
    try {
      const photos = await ctx.telegram.getUserProfilePhotos(user.id, { limit: 1 });
      if (photos.total_count > 0) {
        const file = await ctx.telegram.getFile(photos.photos[0][photos.photos[0].length - 1].file_id);
        profilePhotoUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
      }
    } catch (err) {
      console.log('Tidak bisa ambil foto profile:', err.message);
    }

    // Buat gambar ID Card
    const width = 800;
    const height = 1000;
    const canvas = createCanvas(width, height);
    const c = canvas.getContext('2d');

    // Background futuristik (gradient gelap + neon)
    const gradient = c.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a001f');
    gradient.addColorStop(0.4, '#1a0033');
    gradient.addColorStop(1, '#000d1a');
    c.fillStyle = gradient;
    c.fillRect(0, 0, width, height);

    // Garis neon horizontal
    c.strokeStyle = 'rgba(0, 255, 255, 0.4)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(50, 150);
    c.lineTo(width - 50, 150);
    c.stroke();

    // Foto profile (lingkaran dengan glow)
    let profileImg = null;
    if (profilePhotoUrl) {
      try {
        const response = await fetch(profilePhotoUrl);
        const buffer = await response.buffer();
        profileImg = await loadImage(buffer);
      } catch (err) {
        console.log('Gagal load foto:', err.message);
      }
    }

    if (profileImg) {
      c.save();
      c.beginPath();
      c.arc(400, 280, 140, 0, Math.PI * 2);
      c.clip();
      c.drawImage(profileImg, 260, 140, 280, 280);
      c.restore();

      // Glow neon
      c.shadowColor = '#00ffff';
      c.shadowBlur = 25;
      c.strokeStyle = '#00ffff';
      c.lineWidth = 6;
      c.beginPath();
      c.arc(400, 280, 140, 0, Math.PI * 2);
      c.stroke();
      c.shadowBlur = 0;
    } else {
      // Placeholder kalau tidak ada foto
      c.fillStyle = '#00ffff';
      c.font = 'bold 120px Arial';
      c.textAlign = 'center';
      c.fillText('?', 400, 320);
    }

    // Judul
    c.font = 'bold 48px Arial';
    c.fillStyle = '#00ffff';
    c.textAlign = 'center';
    c.fillText('TELEGRAM ID CARD', width / 2, 520);

    // Info user
    c.font = 'bold 28px Arial';
    c.fillStyle = '#e0f7ff';
    c.textAlign = 'left';
    const leftMargin = 80;
    let y = 580;

    c.fillText(`Nama       : ${fullName}`, leftMargin, y); y += 50;
    c.fillText(`User ID    : ${userId}`, leftMargin, y); y += 50;
    c.fillText(`Username   : ${username}`, leftMargin, y); y += 50;
    c.fillText(`Premium    : ${isPremium}`, leftMargin, y); y += 50;
    c.fillText(`DC ID      : 5 (contoh)`, leftMargin, y);

    // Link di bawah (teks)
    c.font = '24px Arial';
    c.fillStyle = '#00ff9d';
    c.textAlign = 'center';
    c.fillText('JOIN STORE KAMI 🔥', width / 2, height - 120);
    c.fillText('https://t.me/+GANTI_DENGAN_LINK_KAMU', width / 2, height - 80);

    // Convert ke buffer
    const buffer = canvas.toBuffer('image/png');

    // Kirim gambar + tombol
    await ctx.replyWithPhoto(
      { source: buffer },
      {
        caption: `✨ ID Card futuristik kamu sudah jadi!\n\nKlik tombol di bawah untuk join store kami!`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'JOIN STORE KAMI 🔥',
                url: 'https://t.me/+GANTI_DENGAN_LINK_KAMU' // GANTI DI SINI
              }
            ],
            [
              { text: 'Help / Info', callback_data: 'help' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Error di /start:', error);
    await ctx.reply('Maaf, ada masalah saat membuat ID Card. Coba lagi nanti ya.');
  }
});

// Handler button Help (contoh)
bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Bot ini menampilkan ID Card Telegram kamu dalam gaya futuristik.\nKetik /start untuk mencoba!');
});

// Set webhook saat server start
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server berjalan di port ${PORT}`);

  const webhookUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost:' + PORT}/webhook`;
  try {
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`Webhook berhasil di-set ke: ${webhookUrl}`);
  } catch (err) {
    console.error('Gagal set webhook:', err);
  }
});

// Route webhook
app.use('/webhook', bot.webhookCallback('/webhook'));

// Error handling global
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
