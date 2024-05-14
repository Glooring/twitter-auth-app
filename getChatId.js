const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();  // Load environment variables

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.on('message', (msg) => {
  console.log(msg);
  bot.sendMessage(msg.chat.id, `Your chat ID is: ${msg.chat.id}`);
});
