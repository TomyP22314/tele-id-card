import 'dotenv/config'
import express from 'express'
import { Telegraf, Markup } from 'telegraf'

const bot = new Telegraf(process.env.BOT_TOKEN)
const app = express()

const PORT = process.env.PORT || 3000
const PUBLIC_URL = process.env.PUBLIC_URL
const STORE_URL = process.env.STORE_URL || 'https://t.me/yourchannel'

function esc(s = '') {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function calcDcId(userId) {
  // DC ID asli tidak tersedia di Bot API -> ini dummy biar mirip bot cekid
  // kamu boleh ganti logikanya sendiri
  return String(userId).slice(0, 1) || '-'
}

function buildCardFromUser(user) {
  const name = esc([user.first_name, user.last_name].filter(Boolean).join(' ') || '-')
  const username = user.username ? `@${esc(user.username)}` : 'Tidak ada'
  const userId = user.id
  const premium = user.is_premium ? 'Ya' : 'Tidak'
  const dcId = calcDcId(userId)

  const mention = `<a href="tg://user?id=${userId}">${name}</a>`

  return (
`<b>🪪 TELEGRAM ID CARD</b>
<blockquote>
<b>Nama:</b> ${name}
<b>User ID:</b> <code>${userId}</code>
<b>Username:</b> ${username}
<b>DC ID:</b> <code>${dcId}</code>
<b>Premium?:</b> ${premium}
</blockquote>

<b>👤 Mention:</b> ${mention}
<b>🆔 ID Kamu:</b> <code>${userId}</code>
<b>👤 Username:</b> ${username}
<b>🏛 DC ID:</b> <code>${dcId}</code>
<b>⭐ Akun Premium:</b> ${premium}

━━━━━━━━━━━━━━━━━━━━
Ketik <code>/help</code> untuk melihat fitur lainnya.`
  )
}

function keyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.url('💎 JOIN STORE KAMI', STORE_URL)],
    [Markup.button.callback('🔄 Refresh', 'REFRESH')],
  ])
}

// /start -> cek diri sendiri
bot.start(async (ctx) => {
  await ctx.reply(buildCardFromUser(ctx.from), {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...keyboard(),
  })
})

// /id -> cek diri sendiri
bot.command('id', async (ctx) => {
  await ctx.reply(buildCardFromUser(ctx.from), {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
})

bot.command('help', async (ctx) => {
  await ctx.reply(
`<b>📌 Perintah:</b>
<code>/start</code> - tampilkan kartu kamu
<code>/id</code> - tampilkan kartu kamu
<code>/cek</code> - reply ke pesan orang, lalu ketik /cek untuk cek dia

<b>Contoh:</b>
Reply pesan teman → ketik <code>/cek</code>`,
    { parse_mode: 'HTML' }
  )
})

// /cek -> kalau reply pesan orang, cek orang itu. kalau tidak, cek diri sendiri
bot.command('cek', async (ctx) => {
  const replied = ctx.message?.reply_to_message
  const targetUser = replied?.from || ctx.from

  await ctx.reply(buildCardFromUser(targetUser), {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
})

// Refresh tombol
bot.action('REFRESH', async (ctx) => {
  await ctx.answerCbQuery('Di-refresh ✅')

  // refresh kartu untuk user yang klik tombol (ctx.from)
  await ctx.editMessageText(buildCardFromUser(ctx.from), {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...keyboard(),
  })
})

// ===== Render Webhook =====
app.use(express.json())
app.get('/', (_, res) => res.send('OK'))

const WEBHOOK_PATH = '/telegram'

app.post(WEBHOOK_PATH, (req, res) => {
  bot.handleUpdate(req.body, res)
})

app.listen(PORT, async () => {
  const webhookUrl = `${PUBLIC_URL}${WEBHOOK_PATH}`
  console.log('Server running on', PORT)
  console.log('Webhook URL:', webhookUrl)

  // set webhook (kalau redeploy cepat bisa kena 429, tapi biasanya aman)
  await bot.telegram.setWebhook(webhookUrl)
  console.log('Webhook set ✅')
})
