import 'dotenv/config'
import { Telegraf } from 'telegraf'

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start(async (ctx) => {
  const user = ctx.from

  const name = `${user.first_name || ''} ${user.last_name || ''}`
  const username = user.username ? `@${user.username}` : 'Tidak ada'
  const premium = user.is_premium ? "Ya" : "Tidak"

  const text = `
<b>🪪 TELEGRAM ID CARD</b>

👤 <b>Nama:</b> ${name}
🆔 <b>User ID:</b> <code>${user.id}</code>
🔗 <b>Username:</b> ${username}
⭐ <b>Premium:</b> ${premium}
`

  await ctx.reply(text, { parse_mode: 'HTML' })
})

bot.launch()
console.log("Bot jalan...")
