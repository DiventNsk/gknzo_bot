// test-bridge.js - тестирование промежуточного сервера
const axios = require('axios');

// Тестовые данные
const testData = {
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
      id: "test1",
      task_text: "Тестовая задача 1",
      product: "Результат задачи 1",
      status: "Выполнено",
      comment: "Комментарий к задаче 1"
    },
    {
      id: "test2",
      task_text: "Тестовая задача 2",
      product: "Результат задачи 2",
      status: "Не выполнено",
      comment: "Комментарий к задаче 2"
    }
  ],
  unplanned_tasks: [
    {
      id: "unplanned1",
      task_text: "Внеплановая задача",
      product: "Результат внеплановой задачи",
      status: "Выполнено"
    }
  ],
  calculated_stats: {
    done: 1,
    total: 2,
    percent: 50
  },
  id: "test_report_id_" + Date.now(),
  created_at: new Date().toISOString()
};

console.log("Отправляем тестовые данные на промежуточный сервер...");

axios.post('http://localhost:3001/api/send-to-telegram', testData)
  .then(response => {
    console.log('Ответ от промежуточного сервера:', response.data);
    console.log('Данные успешно отправлены в Telegram через промежуточный сервер!');
  })
  .catch(error => {
    console.error('Ошибка при отправке данных:', error.response?.data || error.message);
  });