const { Telegraf } = require('telegraf');
const express = require('express');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Handler command /start (sama seperti sebelumnya)
bot.start(async (ctx) => {
    const user = ctx.from;
    const username = user.username ? `@${user.username}` : 'Tidak ada';
    const premium = user.is_premium ? 'Ya' : 'Tidak';

    let photoId = null;
    try {
        const photos = await ctx.telegram.getUserProfilePhotos(user.id, { limit: 1 });
        if (photos.total_count > 0) {
            photoId = photos.photos[0][0].file_id;
        }
    } catch (err) {
        console.error('Gagal ambil foto:', err);
    }

    const text = `
✦ <b>TELEGRAM ID CARD</b> ✦

Nama          : ${user.first_name || ''} ${user.last_name || ''}
User ID       : <code>${user.id}</code>
Username      : ${username}
DC ID         : 5 (contoh)
Premium?      : ${premium}
    `.trim();

    const extra = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Help', callback_data: 'help' }],
                [{ text: 'JOIN STORE KAMI 🔥', url: 'https://t.me/+linkkamu' }]
            ]
        }
    };

    if (photoId) {
        await ctx.replyWithPhoto(photoId, { caption: text, ...extra });
    } else {
        await ctx.reply(text, extra);
    }
});

bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Ketik /start untuk lihat ID Card!');
});

// Setup Express untuk webhook
const app = express();
const secretPath = `/telegraf/${process.env.BOT_TOKEN}`; // path rahasia biar aman

app.use(bot.webhookCallback(secretPath));

// Route sederhana supaya Render tahu service hidup
app.get('/', (req, res) => {
    res.send('Telegram ID Card Bot is alive! 🚀');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server jalan di port ${PORT}`);

    // Set webhook otomatis pas start (pakai URL Render)
    const webhookUrl = `${process.env.RENDER_EXTERNAL_HOSTNAME}${secretPath}`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`Webhook set ke: ${webhookUrl}`);
});
