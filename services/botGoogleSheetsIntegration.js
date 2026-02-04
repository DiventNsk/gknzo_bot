// services/botGoogleSheetsIntegration.js

const { Bot, InlineKeyboard } = require('grammy');
const GoogleSheetsService = require('./googleSheetsService');

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

class BotGoogleSheetsIntegration {
  constructor(botToken) {
    this.bot = new Bot(botToken);
    this.sheetsService = new GoogleSheetsService();
  }

  setupCommands() {
    // Команда для получения данных из Google Sheets
    this.bot.command('getsheetsdata', async (ctx) => {
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
    this.bot.command('sheetsmeta', async (ctx) => {
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
  }

  getBot() {
    return this.bot;
  }
}

module.exports = BotGoogleSheetsIntegration;