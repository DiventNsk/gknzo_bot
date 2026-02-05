// server-bridge.js - промежуточный сервер для отправки данных в Telegram
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Простой эндпоинт для проверки работы сервера
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head><title>Bridge Server для формы отчетов</title></head>
        <body>
            <h1>Bridge Server для формы отчетов</h1>
            <p>Этот сервер принимает данные из формы и отправляет их в Telegram</p>
            <p>Для отправки данных используйте POST запрос на /api/send-to-telegram</p>
        </body>
        </html>
    `);
});

// Эндпоинт для приема данных из формы и отправки в Telegram
app.post('/api/send-to-telegram', async (req, res) => {
    try {
        const reportData = req.body;
        
        // Форматирование сообщения для Telegram
        let message = `📊 <b>Новый отчет от ${reportData.department}</b>\n\n`;
        message += `🏢 Отдел: ${reportData.department}\n`;
        message += `📅 Период: ${reportData.period?.week_dates || 'Не указан'}\n`;
        message += `📈 Тип отчета: ${reportData.report_type === 'weekly' ? 'Недельный' : 'Месячный'}\n\n`;

        // Добавляем KPIs только если отдел не ГИ
        if (reportData.department !== 'ГИ') {
            message += `<b>🎯 Показатели:</b>\n`;
            if (reportData.kpi_indicators?.deals?.quantity > 0) {
                message += `🔹 Сделки: ${reportData.kpi_indicators.deals.quantity} (${reportData.kpi_indicators.deals.description || 'Нет описания'})\n`;
            }
            if (reportData.kpi_indicators?.meetings?.quantity > 0) {
                message += `🔹 Планерки: ${reportData.kpi_indicators.meetings.quantity} (${reportData.kpi_indicators.meetings.description || 'Нет описания'})\n`;
            }
            if (reportData.kpi_indicators?.training?.quantity > 0) {
                message += `🔹 Обучение: ${reportData.kpi_indicators.training.quantity} (${reportData.kpi_indicators.training.description || 'Нет описания'})\n`;
            }
        }
        
        // Добавляем задачи
        if (reportData.tasks && reportData.tasks.length > 0) {
            message += `\n<b>✅ Задачи:</b>\n`;
            reportData.tasks.forEach((task, index) => {
                message += `${index + 1}. <b>${task.task_text || 'Без названия'}</b> - ${task.status || 'Без статуса'}\n`;
                if (task.product) {
                    message += `   Результат: ${task.product}\n`;
                }
                if (task.comment) {
                    message += `   Комментарий: ${task.comment}\n`;
                }
            });
        }
        
        // Добавляем внеплановые задачи
        if (reportData.unplanned_tasks && reportData.unplanned_tasks.length > 0) {
            message += `\n<b>⚠️ Вне плана:</b>\n`;
            reportData.unplanned_tasks.forEach((task, index) => {
                message += `${index + 1}. <b>${task.task_text || 'Без названия'}</b> - ${task.status || 'Без статуса'}\n`;
                if (task.product) {
                    message += `   Результат: ${task.product}\n`;
                }
            });
        }
        
        // Добавляем статистику
        message += `\n📊 Эффективность: ${reportData.calculated_stats?.percent || 0}% (${reportData.calculated_stats?.done || 0}/${reportData.calculated_stats?.total || 0})`;
        
        // Отправляем в Telegram
        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;
        
        if (!telegramBotToken || !telegramChatId) {
            console.error('Telegram credentials not set');
            return res.status(500).json({ error: 'Telegram credentials not set' });
        }
        
        const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        
        const response = await axios.post(telegramApiUrl, {
            chat_id: telegramChatId,
            text: message,
            parse_mode: 'HTML'
        });
        
        console.log('Successfully sent to Telegram:', response.data);
        
        // Возвращаем успешный ответ
        res.json({ 
            success: true, 
            message: 'Данные успешно отправлены в Telegram',
            telegram_response: response.data
        });
    } catch (error) {
        console.error('Error processing report data:', error);
        res.status(500).json({ 
            error: 'Error processing report data',
            details: error.message 
        });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Bridge server running on http://localhost:${PORT}`);
    console.log('Ready to receive form data and send to Telegram');
});

module.exports = app;