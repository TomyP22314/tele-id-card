import 'dotenv/config'
import { Telegraf } from 'telegraf'
import { createCanvas, loadImage } from 'canvas'
import axios from 'axios'
import fs from 'fs'

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start(async (ctx) => {
  try {
    const user = ctx.from

    const name = `${user.first_name || ''} ${user.last_name || ''}`
    const username = user.username ? `@${user.username}` : 'Tidak ada'
    const userId = user.id
    const premium = user.is_premium ? "Ya" : "Tidak"

    // Ambil foto profil
    let photoUrl = null
    const photos = await ctx.telegram.getUserProfilePhotos(userId, { limit: 1 })

    if (photos.total_count > 0) {
      const fileId = photos.photos[0][0].file_id
      const file = await ctx.telegram.getFile(fileId)
      photoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`
    }

    // Buat canvas
    const canvas = createCanvas(800, 400)
    const ctxCanvas = canvas.getContext('2d')

    // Background
    ctxCanvas.fillStyle = '#2b2d42'
    ctxCanvas.fillRect(0, 0, 800, 400)

    // Judul
    ctxCanvas.fillStyle = '#ffd166'
    ctxCanvas.font = 'bold 40px Arial'
    ctxCanvas.fillText('TELEGRAM ID CARD', 220, 70)

    ctxCanvas.fillStyle = '#ffffff'
    ctxCanvas.font = '28px Arial'

    ctxCanvas.fillText(`Nama: ${name}`, 250, 140)
    ctxCanvas.fillText(`User ID: ${userId}`, 250, 190)
    ctxCanvas.fillText(`Username: ${username}`, 250, 240)
    ctxCanvas.fillText(`Premium?: ${premium}`, 250, 290)

    // DC ID (perkiraan kasar dari digit awal ID)
    const dcId = String(userId)[0]
    ctxCanvas.fillText(`DC ID: ${dcId}`, 250, 340)

    // Foto profil
    if (photoUrl) {
      const image = await loadImage(photoUrl)
      ctxCanvas.drawImage(image, 40, 120, 150, 150)
    }

    const buffer = canvas.toBuffer('image/png')

    await ctx.replyWithPhoto({ source: buffer })

  } catch (err) {
    console.log(err)
    ctx.reply("Terjadi kesalahan.")
  }
})

bot.launch()
console.log("Bot jalan...")
