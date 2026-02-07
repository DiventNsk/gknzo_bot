const { chromium } = require('playwright');

async function finalScreenshots() {
  let browser;
  try {
    // Запуск браузера в безголовом режиме
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Переход на главную страницу
    console.log('Открываю главную страницу...');
    await page.goto('http://localhost:3000');

    // Проверка, если мы на странице входа, то выполняем авторизацию
    if (page.url().includes('/login.html') || page.url().includes('localhost:3000/login')) {
      console.log('Находимся на странице входа, выполняем авторизацию...');

      // Ввод логина
      await page.fill('#login', 'admin');

      // Ввод пароля
      await page.fill('#password', 'gknzo123');

      // Нажатие кнопки входа
      await page.click('button[type="submit"]');

      // Ожидание перехода на главную страницу после входа
      await page.waitForURL('http://localhost:3000/');
      console.log('Успешно вошли в систему');
    } else {
      console.log('Уже авторизованы или на главной странице');
    }

    // Ждем подольше для полной загрузки интерфейса
    console.log('Жду 10 секунд для полной загрузки интерфейса...');
    await page.waitForTimeout(10000);
    
    // Сделать скриншот главной страницы (это будет вид "Отчеты", так как это состояние по умолчанию)
    console.log('Делаю скриншот главной страницы (раздел "Отчеты")...');
    await page.screenshot({
      path: 'reports_section.png',
      fullPage: true
    });

    // Вызов функции для перехода в раздел "Заполнить"
    console.log('Перехожу в раздел "Заполнить" через прямой вызов функции...');
    await page.evaluate(() => {
      if (typeof navigate === 'function') {
        navigate('create');
      }
    });
    
    // Ждем загрузки раздела
    await page.waitForTimeout(5000);
    
    // Сделать скриншот раздела "Заполнить"
    console.log('Делаю скриншот раздела "Заполнить"...');
    await page.screenshot({
      path: 'fill_section.png',
      fullPage: true
    });

    // Вызов функции для перехода в раздел "Директор"
    console.log('Перехожу в раздел "Директор" через прямой вызов функции...');
    await page.evaluate(() => {
      if (typeof selectDirectorView === 'function') {
        selectDirectorView();
      }
    });
    
    // Ждем загрузки раздела
    await page.waitForTimeout(5000);
    
    // Сделать скриншот раздела "Директор"
    console.log('Делаю скриншот раздела "Директор"...');
    await page.screenshot({
      path: 'director_mode.png',
      fullPage: true
    });

    // Вернемся к разделу "Отчеты" для завершения
    console.log('Возвращаюсь в раздел "Отчеты" для завершения...');
    await page.evaluate(() => {
      if (typeof navigate === 'function') {
        navigate('sheets');
      }
    });
    
    // Ждем загрузки раздела
    await page.waitForTimeout(3000);
    
    // Сделать финальный скриншот
    console.log('Делаю финальный скриншот...');
    await page.screenshot({
      path: 'final_view.png',
      fullPage: true
    });

    console.log('Все скриншоты успешно сделаны!');
    console.log('- reports_section.png (Отчеты - вид по умолчанию)');
    console.log('- fill_section.png (Заполнить)');
    console.log('- director_mode.png (Директор)');
    console.log('- final_view.png (Финальный вид)');

    // Также получим информацию о структуре интерфейса
    console.log('\\n=== Информация о структуре интерфейса ===');
    
    const currentPageUrl = await page.url();
    console.log('Текущий URL:', currentPageUrl);
    
    const pageTitle = await page.title();
    console.log('Заголовок страницы:', pageTitle);
    
    // Получим информацию о текущем состоянии
    const currentState = await page.evaluate(() => {
      return {
        viewType: typeof state !== 'undefined' ? state.view : 'unknown',
        reportType: typeof state !== 'undefined' ? state.reportType : 'unknown',
        korsovetMode: typeof state !== 'undefined' ? state.korsovetMode : 'unknown',
        hasNavigateFunction: typeof navigate !== 'undefined',
        hasSelectDirectorViewFunction: typeof selectDirectorView !== 'undefined'
      };
    });
    
    console.log('Состояние приложения:', JSON.stringify(currentState, null, 2));
    
  } catch (error) {
    console.error('Произошла ошибка:', error);
  } finally {
    // Закрытие браузера
    if (browser) {
      await browser.close();
    }
  }
}

// Запуск функции
finalScreenshots();