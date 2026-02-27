const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
    const user = ctx.from;
    const username = user.username ? `@${user.username}` : 'Tidak ada';
    const premium = user.is_premium ? 'Ya' : 'Tidak';

    // Ambil foto profile (jika ada)
    let photoId = null;
    try {
        const photos = await ctx.telegram.getUserProfilePhotos(user.id, { limit: 1 });
        if (photos.total_count > 0) {
            photoId = photos.photos[0][0].file_id; // ukuran terkecil biar cepat
        }
    } catch (err) {
        console.log('Gagal ambil foto:', err);
    }

    const text = `
✦ <b>TELEGRAM ID CARD</b> ✦

Nama          : ${user.first_name || ''} ${user.last_name || ''}
User ID       : <code>${user.id}</code>
Username      : ${username}
DC ID         : 5 (contoh)   // Note: DC ID butuh MTProto kalau mau akurat
Premium?      : ${premium}
    `.trim();

    const extra = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Help', callback_data: 'help' }],
                [{ text: 'JOIN STORE KAMI 🔥', url: 'https://t.me/chgoms_ofc' }]
            ]
        }
    };

    if (photoId) {
        await ctx.replyWithPhoto(photoId, { caption: text, ...extra });
    } else {
        await ctx.reply(text, extra);
    }
});

// Contoh handler button help
bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Ketik /start untuk lihat ID Card kamu!\nFitur lain coming soon...');
});

// Untuk command /id juga bisa pakai yang sama
bot.command('id', (ctx) => ctx.scene.enter('start')); // atau copy logic start

// Jalankan bot
bot.launch()
    .then(() => console.log('Bot berjalan!'))
    .catch(err => console.error('Error launch:', err));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
