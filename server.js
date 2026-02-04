const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const helmet = require('helmet');
const SheetsApiService = require('./services/sheetsApiService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Защита заголовков
app.use(cors()); // Разрешение кросс-доменных запросов
app.use(express.json()); // Парсинг JSON

// Создаем экземпляр сервиса для внешнего API
const sheetsApiService = new SheetsApiService();

// Маршрут для получения данных из Google Sheets через Google API (прямой доступ)
app.get('/api/sheets/:spreadsheetId/:range', async (req, res) => {
  try {
    const { spreadsheetId, range } = req.params;

    // Для аутентификации можно использовать service account
    // или OAuth2 в зависимости от требований безопасности

    // ВНИМАНИЕ: В реальном приложении НЕ храните credentials в открытом виде
    // Используйте .env файл или сервисы для хранения секретов

    // Пример использования service account
    const auth = new google.auth.GoogleAuth({
      // Укажите путь к файлу service account credentials
      // ключевые файлы НЕ должны храниться в репозитории
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Чтение данных из Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: range || 'A:Z', // по умолчанию читаем столбцы A-Z
    });

    const rows = response.data.values;
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Ошибка при получении данных из Google Sheets:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Не удалось получить данные из Google Sheets'
    });
  }
});

// Маршрут для получения данных из Google Sheets через внешний API (альтернативный способ)
app.get('/api/sheets-external/:spreadsheetId', async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const sheetName = req.query.sheetName || ''; // название листа передается как query параметр
    const options = {
      fields: req.query.fields || null,
      filter: req.query.filter || null,
      sort: req.query.sort || null,
      limit: req.query.limit || null,
      offset: req.query.offset || null
    };

    // Используем внешний API для получения данных
    const result = await sheetsApiService.getSpreadsheetData(spreadsheetId, sheetName, options);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Ошибка при получении данных из внешнего Sheets API:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Не удалось получить данные из внешнего Sheets API'
    });
  }
});

// Альтернативный маршрут с указанием названия листа
app.get('/api/sheets-external/:spreadsheetId/sheet/:sheetName', async (req, res) => {
  try {
    const { spreadsheetId, sheetName } = req.params;
    const options = {
      fields: req.query.fields || null,
      filter: req.query.filter || null,
      sort: req.query.sort || null,
      limit: req.query.limit || null,
      offset: req.query.offset || null
    };

    // Используем внешний API для получения данных
    const result = await sheetsApiService.getSpreadsheetData(spreadsheetId, sheetName, options);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Ошибка при получении данных из внешнего Sheets API:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Не удалось получить данные из внешнего Sheets API'
    });
  }
});

// Маршрут для получения данных через LivePolls Sheets to API
app.get('/api/livepolls-sheets/:spreadsheetId', async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const sheetName = req.query.sheetName || ''; // название листа передается как query параметр
    const options = {
      fields: req.query.fields || null,
      filter: req.query.filter || null,
      sort: req.query.sort || null,
      limit: req.query.limit || null,
      offset: req.query.offset || null
    };

    // Используем LivePolls Sheets to API для получения данных
    const result = await sheetsApiService.getSpreadsheetData(spreadsheetId, sheetName, options);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Ошибка при получении данных из LivePolls Sheets API:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Не удалось получить данные из LivePolls Sheets API'
    });
  }
});

// Альтернативный маршрут с указанием названия листа для LivePolls API
app.get('/api/livepolls-sheets/:spreadsheetId/sheet/:sheetName', async (req, res) => {
  try {
    const { spreadsheetId, sheetName } = req.params;
    const options = {
      fields: req.query.fields || null,
      filter: req.query.filter || null,
      sort: req.query.sort || null,
      limit: req.query.limit || null,
      offset: req.query.offset || null
    };

    // Используем LivePolls Sheets to API для получения данных
    const result = await sheetsApiService.getSpreadsheetData(spreadsheetId, sheetName, options);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Ошибка при получении данных из LivePolls Sheets API:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Не удалось получить данные из LivePolls Sheets API'
    });
  }
});

// Маршрут для получения метаданных таблицы
app.get('/api/sheets/:spreadsheetId/metadata', async (req, res) => {
  try {
    const { spreadsheetId } = req.params;

    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Получение метаданных таблицы
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    res.json({ success: true, metadata: response.data });
  } catch (error) {
    console.error('Ошибка при получении метаданных Google Sheets:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Не удалось получить метаданные Google Sheets'
    });
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.json({
    message: 'Express сервер для доступа к Google Sheets API',
    endpoints: {
      'GET /api/sheets/:spreadsheetId/:range': 'Получить данные из Google Sheets (через Google API)',
      'GET /api/sheets-external/:spreadsheetId/:sheetName?': 'Получить данные из Google Sheets (через внешний API)',
      'GET /api/livepolls-sheets/:spreadsheetId/:sheetName?': 'Получить данные из Google Sheets (через LivePolls Sheets to API)',
      'GET /api/sheets/:spreadsheetId/metadata': 'Получить метаданные таблицы'
    }
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Доступные маршруты:`);
  console.log(`GET http://localhost:${PORT}/`);
  console.log(`GET http://localhost:${PORT}/api/sheets/:spreadsheetId/:range`);
  console.log(`GET http://localhost:${PORT}/api/sheets-external/:spreadsheetId/:sheetName`);
  console.log(`GET http://localhost:${PORT}/api/sheets/:spreadsheetId/metadata`);
});

module.exports = app;