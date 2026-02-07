const axios = require('axios');

// Тестовые данные, имитирующие отправку из формы
const formData = {
  department: "Тестовый отдел",
  report_type: "weekly",
  period: {
    week_dates: "01.02.26 - 08.02.26",
    is_manual: false
  },
  kpi_indicators: {
    deals: { quantity: 5, description: "Заключено 5 сделок" },
    meetings: { quantity: 3, description: "Проведено 3 планерки" },
    training: { quantity: 2, description: "Пройдено 2 обучения" }
  },
  tasks: [
    {
      id: "test_task_1",
      task_text: "Тестовая задача 1",
      product: "Результат задачи 1",
      status: "Выполнено",
      comment: "Комментарий к задаче 1"
    }
  ],
  unplanned_tasks: [],
  calculated_stats: {
    done: 1,
    total: 1,
    percent: 100
  },
  id: "test_report_id_" + Date.now(),
  created_at: new Date().toISOString()
};

console.log("Пытаемся отправить тестовые данные на ваш сервер...");

// Попробуем отправить на основной сервер
// Так как мы не знаем точный URL вашего основного сервера, 
// попробуем различные варианты

const possibleUrls = [
  'https://table-two-rosy.vercel.app/api/reports',
  'https://table-two-rosy.vercel.app/api/report',
  'https://table-two-rosy.vercel.app/reports',
  'https://table-two-rosy.vercel.app/report',
];

async function testApiEndpoints() {
  for (const url of possibleUrls) {
    try {
      console.log(`Попытка отправки на: ${url}`);
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(`Успешный ответ от ${url}:`, response.data);
      break; // Если один из URL сработал, выходим из цикла
    } catch (error) {
      console.log(`Ошибка при отправке на ${url}:`, error.response?.data || error.message);
    }
  }
}

testApiEndpoints();