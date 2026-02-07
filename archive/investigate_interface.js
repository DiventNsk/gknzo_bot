const { chromium } = require('playwright');

(async () => {
  // Запуск браузера в безголовом режиме
  const browser = await chromium.launch({ headless: true }); // Запускаем в безголовом режиме
  const page = await browser.newPage();

  try {
    // Переход на главную страницу
    console.log('Открываем главную страницу...');
    await page.goto('http://localhost:3000');

    // Проверяем, что мы на странице логина (если не авторизованы)
    if (page.url().includes('/login.html')) {
      console.log('Находимся на странице логина, производим авторизацию...');

      // Вводим логин
      await page.fill('#login', 'admin');

      // Вводим пароль
      await page.fill('#password', 'gknzo123');

      // Нажимаем кнопку входа
      await page.click('button[type="submit"]');

      // Ждем перехода на главную страницу
      await page.waitForURL('http://localhost:3000/');
      console.log('Успешно авторизовались');
    } else {
      console.log('Уже авторизованы или на главной странице');
    }

    // Ждем полной загрузки страницы
    await page.waitForLoadState('networkidle');

    // Делаем скриншот текущего состояния
    console.log('Делаем скриншот главной страницы...');
    await page.screenshot({ path: 'main_page_after_login.png', fullPage: true });

    // Выводим HTML текущей страницы для анализа
    const html = await page.content();
    console.log('HTML страницы после авторизации:');
    console.log(html.substring(0, 2000)); // Показываем только начало HTML
    
    // Ждем несколько секунд перед закрытием, чтобы можно было изучить интерфейс
    console.log('Ждем 10 секунд для изучения интерфейса...');
    await page.waitForTimeout(10000);

    console.log('Тестирование завершено');
  } catch (error) {
    console.error('Произошла ошибка:', error);
    // Делаем скриншот ошибки
    await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
  } finally {
    // Закрываем браузер
    await browser.close();
  }
})();