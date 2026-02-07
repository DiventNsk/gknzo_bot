const { chromium } = require('playwright');

async function takeScreenshotsWithCorrectTiming() {
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

    // Ждем полной загрузки интерфейса и появления навигационных кнопок
    console.log('Жду полной загрузки интерфейса и появления навигационных кнопок...');
    
    // Ждем появление элемента с id="app" и его содержимого
    await page.waitForSelector('#app', { state: 'attached', timeout: 10000 });
    
    // Ждем появление хотя бы одной навигационной кнопки
    await page.waitForSelector('button:has-text("Отчеты")', { timeout: 20000 });
    console.log('Кнопка "Отчеты" найдена, интерфейс загружен');
    
    // Сделать скриншот главной страницы после входа
    console.log('Делаю скриншот главной страницы после входа...');
    await page.screenshot({
      path: 'main_page_after_login.png',
      fullPage: true
    });

    // Найти и кликнуть на кнопку "Отчеты"
    console.log('Перехожу в раздел "Отчеты"...');
    const reportsButton = await page.locator('button:has-text("Отчеты")').first();
    if (await reportsButton.count() > 0) {
      await reportsButton.click();
      console.log('Кнопка "Отчеты" найдена и нажата');
      
      // Ждем загрузки раздела
      await page.waitForTimeout(3000);
      
      // Сделать скриншот раздела "Отчеты"
      console.log('Делаю скриншот раздела "Отчеты"...');
      await page.screenshot({
        path: 'reports_section.png',
        fullPage: true
      });
    } else {
      console.log('Кнопка "Отчеты" не найдена');
    }

    // Найти и кликнуть на кнопку "Заполнить"
    console.log('Перехожу в раздел "Заполнить"...');
    const fillButton = await page.locator('button:has-text("Заполнить")').first();
    if (await fillButton.count() > 0) {
      await fillButton.click();
      console.log('Кнопка "Заполнить" найдена и нажата');
      
      // Ждем загрузки раздела
      await page.waitForTimeout(3000);
      
      // Сделать скриншот раздела "Заполнить"
      console.log('Делаю скриншот раздела "Заполнить"...');
      await page.screenshot({
        path: 'fill_section.png',
        fullPage: true
      });
    } else {
      console.log('Кнопка "Заполнить" не найдена');
    }

    // Найти и кликнуть на кнопку "Директор"
    console.log('Перехожу в раздел "Директор"...');
    const directorButton = await page.locator('button:has-text("Директор")').first();
    if (await directorButton.count() > 0) {
      await directorButton.click();
      console.log('Кнопка "Директор" найдена и нажата');
      
      // Ждем загрузки раздела
      await page.waitForTimeout(3000);
      
      // Сделать скриншот раздела "Директор"
      console.log('Делаю скриншот раздела "Директор"...');
      await page.screenshot({
        path: 'director_mode.png',
        fullPage: true
      });
    } else {
      console.log('Кнопка "Директор" не найдена');
    }

    console.log('Все скриншоты успешно сделаны!');
    console.log('- main_page_after_login.png');
    console.log('- reports_section.png');
    console.log('- fill_section.png');
    console.log('- director_mode.png');
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
takeScreenshotsWithCorrectTiming();