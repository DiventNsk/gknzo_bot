const { Bot, InlineKeyboard } = require('grammy');
const { webAppData } = require('@grammyjs/web-app');
require('dotenv').config();
const BotGoogleSheetsIntegration = require('./services/botGoogleSheetsIntegration');

// Функция для получения разрешенных ID пользователей из .env
function getAllowedUserIds() {
  if (!process.env.ALLOWED_USER_IDS) {
    return []; // Если переменная не установлена, возвращаем пустой массив
  }
  return process.env.ALLOWED_USER_IDS.split(',').map(id => parseInt(id.trim()));
}

// Список разрешенных ID пользователей из .env
const ALLOWED_USER_IDS = getAllowedUserIds(); // Получаем ID из переменной окружения

// Функция проверки доступа
function checkAccess(ctx) {
  const userId = ctx.from?.id;
  if (!userId || !ALLOWED_USER_IDS.includes(userId)) {
    ctx.reply('Доступ запрещен. Ваш ID пользователя не внесен в белый список.');
    return false;
  }
  return true;
}

// Создаем интеграцию с Google Sheets
const botSheetsIntegration = new BotGoogleSheetsIntegration(process.env.BOT_TOKEN);
const bot = botSheetsIntegration.getBot();

// Устанавливаем команды для интеграции с Google Sheets
botSheetsIntegration.setupCommands();

// Команда /start
bot.command('start', async (ctx) => {
  // Проверяем доступ
  if (!checkAccess(ctx)) {
    return;
  }

  const keyboard = new InlineKeyboard()
    .webApp('Открыть Web App', 'https://yourdomain.com/webapp/index.html'); // Замените на ваш домен

  await ctx.reply(
    'Привет! Это Telegram бот с Web App. Нажмите кнопку ниже, чтобы открыть веб-приложение.\n\n' +
    'Доступные команды:\n' +
    '/getsheetsdata - получить данные из Google Sheets\n' +
    '/sheetsmeta - получить метаданные таблицы',
    {
      reply_markup: keyboard,
    }
  );
});

// Обработка данных, полученных от Web App
bot.on('msg:web_app_data', async (ctx) => {
  // Проверяем доступ
  if (!checkAccess(ctx)) {
    return;
  }

  try {
    // Используем специальный middleware для обработки данных Web App
    const data = JSON.parse(ctx.message.webAppData.data);

    if (data.action === 'send_message') {
      await ctx.reply(`Сообщение получено из Web App! Время: ${data.timestamp}, Сообщение: ${data.message}`);
    } else {
      await ctx.reply(`Получены данные из Web App: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error('Ошибка при обработке данных из Web App:', error);
    await ctx.reply('Произошла ошибка при обработке данных из Web App.');
  }
});

// Обработка всех остальных сообщений
bot.on('message', async (ctx) => {
  // Проверяем доступ
  if (!checkAccess(ctx)) {
    return;
  }

  await ctx.reply('Привет! Это тестовый ответ от бота.');
});

// Запускаем бота
bot.start({
  drop_pending_updates: true,
});