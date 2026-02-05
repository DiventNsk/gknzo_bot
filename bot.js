const { Bot } = require('grammy');
require('dotenv').config();

// Создаем экземпляр бота
const bot = new Bot(process.env.BOT_TOKEN);

// Команда /start
bot.command('start', async (ctx) => {
  await ctx.reply('Привет! Это Telegram бот с Web App.');
});

// Обработка всех остальных сообщений
bot.on('message', async (ctx) => {
  await ctx.reply('Привет! Это тестовый ответ от бота.');
});

// Запускаем бота
bot.start({
  drop_pending_updates: true,
});