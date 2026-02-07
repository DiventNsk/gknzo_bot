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
    
    // Ждем немного, чтобы интерфейс полностью отрисовался
    await page.waitForTimeout(2000);

    // Нажимаем на кнопку "Директор" в нижней навигации
    console.log('Переходим в режим директора...');
    
    // Проверим, есть ли уже кнопка "Директор" в DOM
    const directorButtonExists = await page.$('button[onclick="selectDirectorView()"]');
    
    if (directorButtonExists) {
      // Ждем, пока кнопка станет кликабельной
      await page.waitForSelector('button[onclick="selectDirectorView()"]');
      const directorButton = page.locator('button[onclick="selectDirectorView()"]').last();
      await directorButton.click();
    } else {
      // Если кнопки нет, возможно, нужно сначала переключиться в нужный вид
      // Попробуем вызвать функцию напрямую через evaluate
      await page.evaluate(() => {
        if (typeof selectDirectorView === 'function') {
          selectDirectorView();
        }
      });
    }

    // Ждем загрузки режима директора
    // В режиме директора должны появиться специфичные элементы
    await page.waitForFunction(() => {
      const appContent = document.querySelector('#app').innerText;
      return appContent.includes('Режим директора') || 
             appContent.includes('Обзор всех отчётов') ||
             appContent.includes('Неделя') && appContent.includes('Месяц');
    });

    // Делаем скриншот интерфейса
    console.log('Делаем скриншот интерфейса...');
    await page.screenshot({ path: 'director_mode_screenshot.png', fullPage: true });

    // Проверяем наличие панели инструментов Agentation
    const agentationPanel = await page.$('agentation-component');
    if (agentationPanel) {
      console.log('Панель инструментов Agentation найдена на странице');
      
      // Делаем дополнительный скриншот с пометкой про Agentation
      await page.screenshot({ path: 'director_mode_with_agentation.png', fullPage: true });
    } else {
      console.log('Панель инструментов Agentation НЕ найдена на странице');
      
      // Проверим, может быть компонент использует другой селектор
      const agentationElements = await page.$$('div[id*="agent"], div[class*="agent"], *[data-agentation], *[data-testid*="agent"]');
      if (agentationElements.length > 0) {
        console.log('Найдены потенциальные элементы Agentation');
        await page.screenshot({ path: 'director_mode_possible_agentation.png', fullPage: true });
      } else {
        console.log('Не найдено никаких элементов, связанных с Agentation');
      }
    }

    console.log('Тестирование завершено успешно');
  } catch (error) {
    console.error('Произошла ошибка:', error);
    // Делаем скриншот ошибки
    await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
  } finally {
    // Закрываем браузер
    await browser.close();
  }
})();