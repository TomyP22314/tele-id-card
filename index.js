import 'dotenv/config'
import express from 'express'
import { Telegraf, Markup } from 'telegraf'

const bot = new Telegraf(process.env.BOT_TOKEN)
const app = express()

const PORT = process.env.PORT || 3000
const PUBLIC_URL = process.env.PUBLIC_URL
const STORE_URL = process.env.STORE_URL || 'https://t.me/yourchannel'

function escapeHtml(s = '') {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function buildIdCard(ctx) {
  const u = ctx.from
  const nama = escapeHtml([u.first_name, u.last_name].filter(Boolean).join(' ') || '-')
  const username = u.username ? '@' + escapeHtml(u.username) : 'Tidak ada'
  const userId = u.id
  const premium = u.is_premium ? 'Ya' : 'Tidak'
  const dcId = String(userId).slice(0, 1) || '-'
  const mention = `<a href="tg://user?id=${userId}">${nama}</a>`

  return `<b>🪪 TELEGRAM ID CARD</b>

<b>Nama:</b> ${nama}
<b>User ID:</b> <code>${userId}</code>
<b>Username:</b> ${username}
<b>DC ID:</b> <code>${dcId}</code>
<b>Premium?:</b> ${premium}

<b>👤 Mention:</b> ${mention}

Ketik /help untuk melihat fitur lainnya.`
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

bot.command('id', (ctx) => ctx.reply(buildIdCard(ctx), { parse_mode: 'HTML' }))
bot.command('help', (ctx) => ctx.reply('/start\n/id\n/help'))

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

// IMPORTANT: Express harus bisa terima JSON body dari Telegram
app.use(express.json())

app.get('/', (req, res) => res.send('OK'))

// Path webhook statis
const WEBHOOK_PATH = '/telegram'

// Pasang handler webhook Telegraf di path itu
app.post(WEBHOOK_PATH, (req, res) => {
  console.log('Webhook hit ✅') // buat bukti request masuk
  bot.handleUpdate(req.body, res)
})

app.listen(PORT, async () => {
  console.log('Server running on', PORT)

  const webhookUrl = `${PUBLIC_URL}${WEBHOOK_PATH}`
  console.log('Setting webhook to:', webhookUrl)

  // set webhook (sekali)
  await bot.telegram.setWebhook(webhookUrl)
  console.log('Webhook set ✅')
})
