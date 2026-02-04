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

        const result = await this.sheetsService.getSpreadsheetData(spreadsheetId, range);

        if (result.success) {
          const formattedData = this.sheetsService.formatDataForWebApp(result.data);

          if (formattedData.length > 0) {
            // Отправляем пользователю количество строк и возможность открыть Web App с данными
            const keyboard = new InlineKeyboard()
              .webApp('📊 Просмотреть данные', `${process.env.WEB_APP_URL}?view=sheets_data`);

            await ctx.reply(
              `✅ Данные из Google Sheets успешно получены!\n\n` +
              `📋 Найдено строк: ${formattedData.length}\n` +
              `📈 Найдено столбцов: ${result.numCols}\n\n` +
              `Нажмите кнопку ниже, чтобы открыть данные в Web App:`,
              {
                reply_markup: keyboard,
              }
            );
          } else {
            await ctx.reply('⚠️ В указанном диапазоне не найдено данных.');
          }
        } else {
          await ctx.reply(`❌ Ошибка при получении данных из Google Sheets: ${result.message}`);
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

        const result = await this.sheetsService.getSpreadsheetMetadata(spreadsheetId);

        if (result.success) {
          const sheetInfo = result.metadata.sheets.map(sheet => ({
            title: sheet.properties.title,
            sheetId: sheet.properties.sheetId,
            rowCount: sheet.properties.gridProperties.rowCount,
            colCount: sheet.properties.gridProperties.columnCount
          }));

          let metaMessage = `📋 Метаданные таблицы "${result.metadata.properties.title}":\n\n`;
          metaMessage += `🆔 ID таблицы: ${spreadsheetId}\n`;
          metaMessage += `📝 Название: ${result.metadata.properties.title}\n`;
          metaMessage += `👥 Последний редактор: ${result.metadata.lastModifiedBy.displayName}\n\n`;
          metaMessage += `📚 Листы (${sheetInfo.length}):\n`;

          sheetInfo.forEach((sheet, index) => {
            metaMessage += `  ${index + 1}. "${sheet.title}" (ID: ${sheet.sheetId}) - ${sheet.rowCount}×${sheet.colCount}\n`;
          });

          await ctx.reply(metaMessage);
        } else {
          await ctx.reply(`❌ Ошибка при получении метаданных: ${result.message}`);
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