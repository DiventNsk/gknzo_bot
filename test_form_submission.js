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
    },
    {
      id: "test_task_2",
      task_text: "Тестовая задача 2",
      product: "Результат задачи 2",
      status: "Не выполнено",
      comment: "Комментарий к задаче 2"
    }
  ],
  unplanned_tasks: [
    {
      id: "unplanned_task_1",
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

console.log("Отправляем тестовые данные из формы на сервер...");

axios.post('https://table-two-rosy.vercel.app/api/reports', formData)
  .then(response => {
    console.log('Ответ сервера:', response.data);
    console.log('Данные успешно отправлены из формы!');
  })
  .catch(error => {
    console.error('Ошибка при отправке данных из формы:', error.response?.data || error.message);
  });