import 'dotenv/config'
import express from 'express'
import { Telegraf, Markup } from 'telegraf'

const bot = new Telegraf(process.env.BOT_TOKEN)
const app = express()

const PORT = process.env.PORT || 3000
const PUBLIC_URL = process.env.PUBLIC_URL // contoh: https://namaservice.onrender.com
const STORE_URL = process.env.STORE_URL || 'https://t.me/yourchannel' // tombol join

function escapeHtml(s = '') {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function buildIdCard(ctx) {
  const u = ctx.from
  const nama = escapeHtml([u.first_name, u.last_name].filter(Boolean).join(' ') || '-')
  const username = u.username ? '@' + escapeHtml(u.username) : 'Tidak ada'
  const userId = u.id
  const premium = u.is_premium ? 'Ya' : 'Tidak'

  // Catatan: Telegram Bot API tidak memberi DC ID asli.
  // Banyak bot “DC ID” itu cuma perkiraan / dummy.
  const dcId = String(userId).slice(0, 1) || '-'

  const mention = `<a href="tg://user?id=${userId}">${nama}</a>`

  const text =
`<b>🪪 TELEGRAM ID CARD</b>

<b>Nama:</b> ${nama}
<b>User ID:</b> <code>${userId}</code>
<b>Username:</b> ${username}
<b>DC ID:</b> <code>${dcId}</code>
<b>Premium?:</b> ${premium}

<b>👤 Mention:</b> ${mention}
<b>🆔 ID Kamu:</b> <code>${userId}</code>
<b>👤 Username:</b> ${username}
<b>🏛 DC ID:</b> <code>${dcId}</code>
<b>⭐ Akun Premium:</b> ${premium}

Ketik /help untuk melihat fitur lainnya.`

  return text
}

bot.start(async (ctx) => {
  await ctx.reply(buildIdCard(ctx), {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...Markup.inlineKeyboard([
      [Markup.button.url('💎 JOIN STORE KAMI', STORE_URL)],
      [Markup.button.callback('🔄 Refresh', 'REFRESH')],
    ])
  })
})

bot.command('id', async (ctx) => {
  await ctx.reply(buildIdCard(ctx), {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
})

bot.command('help', async (ctx) => {
  await ctx.reply(
    `Perintah:\n` +
    `/id - tampilkan ID Card\n` +
    `/start - tampilkan ID Card + tombol\n`,
    { disable_web_page_preview: true }
  )
})

bot.action('REFRESH', async (ctx) => {
  await ctx.answerCbQuery('Di-refresh ✅')
  await ctx.editMessageText(buildIdCard(ctx), {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...Markup.inlineKeyboard([
      [Markup.button.url('💎 JOIN STORE KAMI', STORE_URL)],
      [Markup.button.callback('🔄 Refresh', 'REFRESH')],
    ])
  })
})

// ---- WEBHOOK SETUP (Render) ----
app.get('/', (req, res) => res.send('OK'))

app.use(await bot.createWebhook({ domain: PUBLIC_URL }))
app.listen(PORT, async () => {
  console.log('Server running on', PORT)

  const webhookUrl = `${PUBLIC_URL}/${bot.secretPathComponent()}`
  console.log('Target webhook:', webhookUrl)

  // 1) cek webhook yang sudah terpasang
  try {
    const info = await bot.telegram.getWebhookInfo()

    if (info?.url === webhookUrl) {
      console.log('Webhook already set ✅ (skip)')
      return
    }
  } catch (e) {
    console.log('getWebhookInfo failed (will try setWebhook anyway):', e?.message || e)
  }

  // 2) set webhook dengan retry kalau 429
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await bot.telegram.setWebhook(webhookUrl)
      console.log('Webhook set ✅')
      break
    } catch (err) {
      const retryAfter =
        err?.response?.parameters?.retry_after ||
        err?.parameters?.retry_after

      const code = err?.response?.error_code || err?.code
      console.log(`setWebhook failed (attempt ${attempt}) code=${code}`, err?.response || err)

      if (code === 429 && retryAfter && attempt < 2) {
        console.log(`Rate limited. Waiting ${retryAfter}s then retry...`)
        await new Promise((r) => setTimeout(r, (retryAfter + 1) * 1000))
        continue
      }

      // kalau bukan 429 atau sudah attempt terakhir
      throw err
    }
  }
})
