const axios = require('axios');

// Тестовые данные для отправки
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

console.log("Отправляем тестовые данные на сервер...");

axios.post('http://localhost:3000/api/reports', testData)
  .then(response => {
    console.log('Ответ сервера:', response.data);
    console.log('Данные успешно отправлены!');
  })
  .catch(error => {
    console.error('Ошибка при отправке данных:', error.response?.data || error.message);
  });