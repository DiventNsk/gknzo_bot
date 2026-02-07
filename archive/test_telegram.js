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
  id: "test_report_id",
  created_at: new Date().toISOString()
};

fetch('http://localhost:3000/api/reports', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));