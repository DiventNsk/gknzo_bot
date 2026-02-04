const { Bot } = require('grammy');
require('dotenv').config();

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

// Создаем бота
const bot = new Bot(process.env.BOT_TOKEN);

const { Keyboard } = require('grammy');

// Команда /start
bot.command('start', async (ctx) => {
  // Проверяем доступ
  if (!checkAccess(ctx)) {
    return;
  }

  // Создаем reply клавиатуру с кнопками для запроса данных
  const keyboard = new Keyboard()
    .text('📊 Получить данные из Google Sheets')
    .row()
    .text('📋 Получить метаданные таблицы')
    .row()
    .text('/start') // Кнопка для возврата к главному меню
    .resized(); // Уменьшаем размер клавиатуры

  await ctx.reply(
    'Привет! Это Telegram бот для получения данных из Google Таблиц.\n\n' +
    'Вы можете воспользоваться командами или кнопками внизу экрана:',
    {
      reply_markup: keyboard
    }
  );
});

// Команда для получения данных из Google Sheets
bot.command('getsheetsdata', async (ctx) => {
  // Проверяем доступ
  if (!checkAccess(ctx)) {
    return;
  }

  try {
    // В реальном приложении spreadsheetId и range могут передаваться как параметры команды
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID; // ID таблицы из .env
    const range = process.env.GOOGLE_SHEETS_RANGE || 'A1:Z100'; // Диапазон из .env или по умолчанию

    if (!spreadsheetId) {
      await ctx.reply('❌ ID таблицы Google Sheets не указан в настройках бота.');
      return;
    }

    // Запрашиваем данные с сервера
    const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/sheets-external/${spreadsheetId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      if (result.data && result.data.length > 0) {
        await ctx.reply(
          `✅ Данные из Google Sheets успешно получены!\n\n` +
          `📋 Найдено строк: ${result.data.length}`
        );

        // Отправляем первые несколько строк в качестве примера
        const sampleData = result.data.slice(0, 5); // первые 5 строк
        await ctx.reply(`Пример данных:\n${JSON.stringify(sampleData, null, 2)}`);
      } else {
        await ctx.reply('⚠️ В указанном диапазоне не найдено данных.');
      }
    } else {
      await ctx.reply(`❌ Ошибка при получении данных из Google Sheets: ${result.message || result.error}`);
    }
  } catch (error) {
    console.error('Ошибка в команде /getsheetsdata:', error);
    await ctx.reply('❌ Произошла ошибка при попытке получить данные из Google Sheets.');
  }
});

// Команда для получения метаданных таблицы
bot.command('sheetsmeta', async (ctx) => {
  // Проверяем доступ
  if (!checkAccess(ctx)) {
    return;
  }

  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!spreadsheetId) {
      await ctx.reply('❌ ID таблицы Google Sheets не указан в настройках бота.');
      return;
    }

    // Запрашиваем метаданные с сервера
    const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/sheets/${spreadsheetId}/metadata`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const metadata = result.metadata;
      let metaMessage = `📋 Метаданные таблицы "${metadata.properties.title}":\n\n`;
      metaMessage += `🆔 ID таблицы: ${spreadsheetId}\n`;
      metaMessage += `📝 Название: ${metadata.properties.title}\n\n`;
      metaMessage += `📚 Листы (${metadata.sheets.length}):\n`;

      metadata.sheets.forEach((sheet, index) => {
        const properties = sheet.properties;
        metaMessage += `  ${index + 1}. "${properties.title}" - ${properties.gridProperties.rowCount}×${properties.gridProperties.columnCount}\n`;
      });

      await ctx.reply(metaMessage);
    } else {
      await ctx.reply(`❌ Ошибка при получении метаданных: ${result.message || result.error}`);
    }
  } catch (error) {
    console.error('Ошибка в команде /sheetsmeta:', error);
    await ctx.reply('❌ Произошла ошибка при попытке получить метаданные Google Sheets.');
  }
});

// Обработка всех остальных сообщений
bot.on('message', async (ctx) => {
  // Проверяем доступ
  if (!checkAccess(ctx)) {
    return;
  }

  await ctx.reply('Привет! Используйте команды /getsheetsdata или /sheetsmeta для получения данных из Google Таблиц, или кнопки внизу экрана.');
});

// Обработчик для кнопки /start
bot.hears('/start', async (ctx) => {
  // Проверяем доступ
  if (!checkAccess(ctx)) {
    return;
  }

  // Создаем reply клавиатуру с кнопками для запроса данных
  const keyboard = new Keyboard()
    .text('📊 Получить данные из Google Sheets')
    .row()
    .text('📋 Получить метаданные таблицы')
    .row()
    .text('/start') // Кнопка для возврата к главному меню
    .resized(); // Уменьшаем размер клавиатуры

  await ctx.reply(
    'Привет! Это Telegram бот для получения данных из Google Таблиц.\n\n' +
    'Вы можете воспользоваться командами или кнопками внизу экрана:',
    {
      reply_markup: keyboard
    }
  );
});

// Обработчик нажатия на кнопку "Получить данные из Google Sheets"
bot.hears('📊 Получить данные из Google Sheets', async (ctx) => {
  // Проверяем доступ
  if (!checkAccess(ctx)) {
    return;
  }

  try {
    // Используем прямой вызов к LivePolls API, как в примере из .env
    // https://sheets.livepolls.app/api/spreadsheets/28ec78fb-2c6d-4025-86f4-703a6c4720b0/%D0%9D%D0%9F
    const apiUrl = 'https://sheets.livepolls.app/api/spreadsheets/28ec78fb-2c6d-4025-86f4-703a6c4720b0/%D0%9D%D0%9F';

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      if (result.data.length > 0) {
        await ctx.reply(
          `✅ Данные из Google Sheets успешно получены!\n\n` +
          `📋 Найдено строк: ${result.data.length}`
        );

        // Отправляем первые несколько строк в качестве примера
        const sampleData = result.data.slice(0, 5); // первые 5 строк
        await ctx.reply(`Пример данных:\n${JSON.stringify(sampleData, null, 2)}`);
      } else {
        await ctx.reply('⚠️ В таблице не найдено данных.');
      }
    } else {
      await ctx.reply(`❌ Ошибка при получении данных из Google Sheets: ${result.msg || result.error || 'Неизвестная ошибка'}`);
    }
  } catch (error) {
    console.error('Ошибка при нажатии на кнопку получения данных:', error);
    await ctx.reply('❌ Произошла ошибка при попытке получить данные из Google Sheets.');
  }
});

// Обработчик нажатия на кнопку "Получить метаданные таблицы"
bot.hears('📋 Получить метаданные таблицы', async (ctx) => {
  // Проверяем доступ
  if (!checkAccess(ctx)) {
    return;
  }

  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!spreadsheetId) {
      await ctx.reply('❌ ID таблицы Google Sheets не указан в настройках бота.');
      return;
    }

    // Запрашиваем метаданные с сервера
    const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/sheets/${spreadsheetId}/metadata`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const metadata = result.metadata;
      let metaMessage = `📋 Метаданные таблицы "${metadata.properties.title}":\n\n`;
      metaMessage += `🆔 ID таблицы: ${spreadsheetId}\n`;
      metaMessage += `📝 Название: ${metadata.properties.title}\n\n`;
      metaMessage += `📚 Листы (${metadata.sheets.length}):\n`;

      metadata.sheets.forEach((sheet, index) => {
        const properties = sheet.properties;
        metaMessage += `  ${index + 1}. "${properties.title}" - ${properties.gridProperties.rowCount}×${properties.gridProperties.columnCount}\n`;
      });

      await ctx.reply(metaMessage);
    } else {
      await ctx.reply(`❌ Ошибка при получении метаданных: ${result.message || result.error}`);
    }
  } catch (error) {
    console.error('Ошибка при нажатии на кнопку получения метаданных:', error);
    await ctx.reply('❌ Произошла ошибка при попытке получить метаданные Google Sheets.');
  }
});

// Функция для безопасного запуска бота
async function startBotSafely() {
  try {
    // Запускаем бота
    await bot.start({
      drop_pending_updates: true,
    });
  } catch (error) {
    console.error('Ошибка при запуске бота:', error);
    // Повторная попытка через некоторое время
    setTimeout(() => {
      console.log('Повторная попытка запуска бота...');
      startBotSafely();
    }, 5000);
  }
}

// Запускаем бота
startBotSafely();