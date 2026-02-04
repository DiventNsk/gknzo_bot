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
        // Проверяем, что первая строка действительно содержит заголовки (массив)
        const firstRow = result.data[0];
        let headers = [];
        let rows = result.data;

        // Проверяем, является ли первая строка массивом (заголовки)
        if (Array.isArray(firstRow)) {
          headers = firstRow;
          rows = result.data.slice(1); // пропускаем заголовки
        } else {
          // Если первая строка не является массивом, используем пустой массив заголовков
          headers = Array.from({ length: firstRow.length || 0 }, (_, i) => `Столбец ${i + 1}`);
        }

        // Находим индекс столбца с датами (предполагаем, что это один из столбцов)
        // В примере из .env видим даты в формате "02.12-08.12.25", ищем похожие заголовки
        let dateColumnIndex = -1;
        if (headers && Array.isArray(headers)) {
          dateColumnIndex = headers.findIndex(header =>
            header && (typeof header === 'string') && (header.includes('.') || header.includes('-')) // Простой способ определить столбец с датами
          );
        }

        // Фильтруем данные
        let filteredRows = rows.filter(row => {
          if (dateColumnIndex !== -1 && Array.isArray(row) && row[dateColumnIndex]) {
            const dateValue = row[dateColumnIndex];
            // Фильтруем, чтобы показать только:
            // 1. Периоды в конце января или феврале
            // 2. Пример: ищем даты, содержащие "01." (январь) или "02." (февраль)
            return (typeof dateValue === 'string') && (dateValue.includes('01.') || dateValue.includes('02.'));
          }
          return true; // Если не найден столбец с датами, возвращаем все строки
        });

        // Сортируем по дате (предполагаем, что формат даты позволяет сравнение строк)
        if (dateColumnIndex !== -1) {
          filteredRows.sort((a, b) => {
            // Простая сортировка строковых дат - от самых свежих
            const dateA = Array.isArray(a) ? a[dateColumnIndex] : '';
            const dateB = Array.isArray(b) ? b[dateColumnIndex] : '';
            return (typeof dateB === 'string' && typeof dateA === 'string') ? dateB.localeCompare(dateA) : 0;
          });
        }

        await ctx.reply(
          `✅ Данные из Google Sheets успешно получены и отфильтрованы!\n\n` +
          `📋 Найдено строк после фильтрации: ${filteredRows.length}`
        );

        // Преобразуем данные в более читаемый формат
        let formattedData = '📋 *Актуальные данные из Google Таблицы (отсортированы по дате, свежие первее):*\n\n';

        // Показываем первые 10 строк в более читаемом формате
        const rowsToShow = filteredRows.slice(0, 10); // берем первые 10 отфильтрованных данных

        for (let i = 0; i < rowsToShow.length; i++) {
          const row = rowsToShow[i];

          // Если строка содержит массив значений
          if (Array.isArray(row)) {
            formattedData += `*Запись ${i + 1}:*\n`;
            for (let j = 0; j < Math.min(headers.length, row.length); j++) {
              const header = headers[j] || `Столбец ${j + 1}`;
              const value = row[j];
              formattedData += `  • ${header}: ${value || 'пусто'}\n`;
            }
          } else {
            // Если строка содержит объект
            formattedData += `*Запись ${i + 1}:*\n`;
            Object.entries(row).forEach(([key, value]) => {
              formattedData += `  • ${key}: ${value || 'пусто'}\n`;
            });
          }

          formattedData += '\n';
        }

        // Добавляем информацию о количестве оставшихся строк
        if (filteredRows.length > 10) {
          formattedData += `... и ещё ${filteredRows.length - 10} строк(и)\n`;
        }

        await ctx.reply(formattedData, { parse_mode: 'Markdown' });
      } else {
        await ctx.reply('⚠️ В таблице не найдено данных.');
      }
    } else {
      await ctx.reply(`❌ Ошибка при получении данных из Google Sheets: ${result.msg || result.error || 'Неизвестная ошибка'}`);
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
        // Проверяем, что первая строка действительно содержит заголовки (массив)
        const firstRow = result.data[0];
        let headers = [];
        let rows = result.data;

        // Проверяем, является ли первая строка массивом (заголовки)
        if (Array.isArray(firstRow)) {
          headers = firstRow;
          rows = result.data.slice(1); // пропускаем заголовки
        } else {
          // Если первая строка не является массивом, используем пустой массив заголовков
          headers = Array.from({ length: firstRow.length || 0 }, (_, i) => `Столбец ${i + 1}`);
        }

        // Находим индекс столбца с датами (предполагаем, что это один из столбцов)
        // В примере из .env видим даты в формате "02.12-08.12.25", ищем похожие заголовки
        let dateColumnIndex = -1;
        if (headers && Array.isArray(headers)) {
          dateColumnIndex = headers.findIndex(header =>
            header && (typeof header === 'string') && (header.includes('.') || header.includes('-')) // Простой способ определить столбец с датами
          );
        }

        // Фильтруем данные
        let filteredRows = rows.filter(row => {
          if (dateColumnIndex !== -1 && Array.isArray(row) && row[dateColumnIndex]) {
            const dateValue = row[dateColumnIndex];
            // Фильтруем, чтобы показать только:
            // 1. Периоды в конце января или феврале
            // 2. Пример: ищем даты, содержащие "01." (январь) или "02." (февраль)
            return (typeof dateValue === 'string') && (dateValue.includes('01.') || dateValue.includes('02.'));
          }
          return true; // Если не найден столбец с датами, возвращаем все строки
        });

        // Сортируем по дате (предполагаем, что формат даты позволяет сравнение строк)
        if (dateColumnIndex !== -1) {
          filteredRows.sort((a, b) => {
            // Простая сортировка строковых дат - от самых свежих
            const dateA = Array.isArray(a) ? a[dateColumnIndex] : '';
            const dateB = Array.isArray(b) ? b[dateColumnIndex] : '';
            return (typeof dateB === 'string' && typeof dateA === 'string') ? dateB.localeCompare(dateA) : 0;
          });
        }

        await ctx.reply(
          `✅ Данные из Google Sheets успешно получены и отфильтрованы!\n\n` +
          `📋 Найдено строк после фильтрации: ${filteredRows.length}`
        );

        // Преобразуем данные в более читаемый формат
        let formattedData = '📋 *Актуальные данные из Google Таблицы (отсортированы по дате, свежие первее):*\n\n';

        // Показываем первые 10 строк в более читаемом формате
        const rowsToShow = filteredRows.slice(0, 10); // берем первые 10 отфильтрованных данных

        for (let i = 0; i < rowsToShow.length; i++) {
          const row = rowsToShow[i];

          // Если строка содержит массив значений
          if (Array.isArray(row)) {
            formattedData += `*Запись ${i + 1}:*\n`;
            for (let j = 0; j < Math.min(headers.length, row.length); j++) {
              const header = headers[j] || `Столбец ${j + 1}`;
              const value = row[j];
              formattedData += `  • ${header}: ${value || 'пусто'}\n`;
            }
          } else {
            // Если строка содержит объект
            formattedData += `*Запись ${i + 1}:*\n`;
            Object.entries(row).forEach(([key, value]) => {
              formattedData += `  • ${key}: ${value || 'пусто'}\n`;
            });
          }

          formattedData += '\n';
        }

        // Добавляем информацию о количестве оставшихся строк
        if (filteredRows.length > 10) {
          formattedData += `... и ещё ${filteredRows.length - 10} строк(и)\n`;
        }

        await ctx.reply(formattedData, { parse_mode: 'Markdown' });
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

// Глобальная переменная для отслеживания состояния бота
let botStarted = false;

// Функция для безопасного запуска бота
async function startBotSafely() {
  // Проверяем, не запущен ли бот уже
  if (botStarted) {
    console.log('Бот уже запущен, пропускаем повторный запуск');
    return;
  }

  try {
    console.log('Попытка запуска бота...');
    botStarted = true;

    // Запускаем бота
    await bot.start({
      drop_pending_updates: true,
    });
  } catch (error) {
    console.error('Ошибка при запуске бота:', error);

    // Сбросим флаг, если произошла ошибка
    botStarted = false;

    // Повторная попытка через некоторое время
    setTimeout(() => {
      console.log('Повторная попытка запуска бота...');
      startBotSafely();
    }, 10000); // Увеличим задержку до 10 секунд
  }
}

// Запускаем бота
startBotSafely();