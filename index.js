const { Telegraf } = require('telegraf');
const { createCanvas, loadImage, registerFont } = require('@napi-rs/canvas'); // atau 'canvas'
const express = require('express');
const fs = require('fs').promises;
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Optional: register font custom untuk futuristik (download font gratis seperti Orbitron.ttf, simpan di folder fonts/)
// registerFont('./fonts/Orbitron-Bold.ttf', { family: 'Orbitron' });

bot.start(async (ctx) => {
    const user = ctx.from;
    const username = user.username ? `@${user.username}` : 'Tidak ada';
    const premium = user.is_premium ? 'Ya' : 'Tidak';
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';

    // Ambil foto profile user (jika ada)
    let profilePhotoUrl = null;
    try {
        const photos = await ctx.telegram.getUserProfilePhotos(user.id, { limit: 1 });
        if (photos.total_count > 0) {
            const file = await ctx.telegram.getFile(photos.photos[0][0].file_id);
            profilePhotoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
        }
    } catch (err) {
        console.error('Gagal ambil foto profile:', err);
    }

    // Generate gambar ID Card
    const width = 800;
    const height = 1200;
    const canvas = createCanvas(width, height);
    const ctxCanvas = canvas.getContext('2d');

    // Background futuristik: gradient dark blue-purple + grid/glow
    const gradient = ctxCanvas.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#24243e');
    ctxCanvas.fillStyle = gradient;
    ctxCanvas.fillRect(0, 0, width, height);

    // Tambah efek neon grid (opsional, bikin lebih cyber)
    ctxCanvas.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctxCanvas.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
        ctxCanvas.beginPath();
        ctxCanvas.moveTo(i, 0);
        ctxCanvas.lineTo(i, height);
        ctxCanvas.stroke();
    }
    for (let i = 0; i < height; i += 50) {
        ctxCanvas.beginPath();
        ctxCanvas.moveTo(0, i);
        ctxCanvas.lineTo(width, i);
        ctxCanvas.stroke();
    }

    // Overlay foto profile user (rounded, glow)
    if (profilePhotoUrl) {
        try {
            const profileImg = await loadImage(profilePhotoUrl);
            ctxCanvas.save();
            ctxCanvas.beginPath();
            ctxCanvas.arc(400, 250, 150, 0, Math.PI * 2); // circle
            ctxCanvas.clip();
            ctxCanvas.drawImage(profileImg, 250, 100, 300, 300);
            ctxCanvas.restore();

            // Glow effect
            ctxCanvas.shadowColor = '#00ffff';
            ctxCanvas.shadowBlur = 30;
            ctxCanvas.strokeStyle = '#00ffff';
            ctxCanvas.lineWidth = 5;
            ctxCanvas.stroke();
            ctxCanvas.shadowBlur = 0;
        } catch (err) {
            console.error('Gagal load foto:', err);
        }
    }

    // Teks futuristik
    ctxCanvas.font = 'bold 48px Arial'; // ganti ke font custom kalau ada
    ctxCanvas.fillStyle = '#00ffff';
    ctxCanvas.textAlign = 'center';
    ctxCanvas.fillText('TELEGRAM ID CARD', width / 2, 500);

    ctxCanvas.font = 'bold 32px Arial';
    ctxCanvas.fillStyle = '#ffffff';
    ctxCanvas.fillText(`Nama: ${fullName}`, width / 2, 580);
    ctxCanvas.fillText(`User ID: ${user.id}`, width / 2, 630);
    ctxCanvas.fillText(`Username: ${username}`, width / 2, 680);
    ctxCanvas.fillText(`DC ID: 5 (contoh)`, width / 2, 730);
    ctxCanvas.fillText(`Premium: ${premium}`, width / 2, 780);

    // Tambah link di bawah (teks clickable kalau di caption)
    ctxCanvas.font = '24px Arial';
    ctxCanvas.fillStyle = '#00ff9d';
    ctxCanvas.fillText('JOIN STORE KAMI 🔥', width / 2, 900);
    ctxCanvas.fillText('https://t.me/+yourlink', width / 2, 950);

    // Convert canvas ke buffer & kirim sebagai photo
    const buffer = await canvas.toBuffer('image/png');
    await ctx.replyWithPhoto({ source: buffer }, {
        caption: `✨ ID Card futuristik kamu siap!\n\nHelp: /help\nJOIN STORE: https://t.me/+yourlink`,
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Help', callback_data: 'help' }],
                [{ text: 'JOIN STORE KAMI 🔥', url: 'https://t.me/+yourlink' }]
            ]
        }
    });
});

// ... (bagian webhook & express seperti sebelumnya tetap)

// Launch atau webhook
// ...
