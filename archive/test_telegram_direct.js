const axios = require('axios');

// Загружаем переменные окружения
require('dotenv').config();

async function testTelegram() {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    console.log('TELEGRAM_BOT_TOKEN exists:', !!telegramBotToken);
    console.log('TELEGRAM_CHAT_ID exists:', !!telegramChatId);

    if (!telegramBotToken || !telegramChatId) {
        console.log('Telegram credentials are not set properly');
        return;
    }

    try {
        const message = 'Тестовое сообщение от формы отчетов';
        const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

        const response = await axios.post(telegramApiUrl, {
            chat_id: telegramChatId,
            text: message,
            parse_mode: 'HTML'
        });

        console.log('Successfully sent test message to Telegram:', response.data);
    } catch (error) {
        console.error('Error sending test message to Telegram:', error.response?.data || error.message);
    }
}

testTelegram();