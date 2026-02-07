const { chromium } = require('playwright');

(async () => {
  // Запуск браузера в безголовом режиме
  const browser = await chromium.launch({ headless: true });
  
  // Используем параметры мобильного устройства для правильного отображения интерфейса
  const iPhone = { 
    name: 'iPhone 12', 
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  };
  
  const context = await browser.newContext({
    viewport: iPhone.viewport,
    userAgent: iPhone.userAgent,
    deviceScaleFactor: iPhone.deviceScaleFactor,
    isMobile: iPhone.isMobile,
    hasTouch: iPhone.hasTouch
  });
  
  const page = await context.newPage();

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

    // Ждем немного, чтобы интерфейс полностью загрузился
    await page.waitForTimeout(2000);

    // Получаем список всех кнопок на странице
    const buttons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.map(btn => ({
        text: btn.innerText,
        id: btn.id,
        classes: btn.className,
        onclick: btn.getAttribute('onclick'),
        innerHTML: btn.innerHTML
      }));
    });
    console.log('Найденные кнопки на странице:');
    console.log(JSON.stringify(buttons, null, 2));

    // Получаем полный HTML для анализа
    const html = await page.content();
    console.log('Полный HTML страницы:');
    console.log(html);

    // Также ищем элементы в нижней навигации
    const navButtons = await page.evaluate(() => {
      const navEls = Array.from(document.querySelectorAll('div.fixed.bottom-0 button'));
      return navEls.map(el => ({
        text: el.innerText,
        id: el.id,
        classes: el.className,
        onclick: el.getAttribute('onclick'),
        innerHTML: el.innerHTML
      }));
    });
    console.log('Найденные кнопки в нижней навигации:');
    console.log(JSON.stringify(navButtons, null, 2));

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