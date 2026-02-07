const { chromium } = require('playwright');

async function takeScreenshots() {
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

    // Ожидание загрузки основного контента и появления навигационных кнопок
    await page.waitForTimeout(5000);

    // Сделать скриншот главной страницы после входа
    console.log('Делаю скриншот главной страницы после входа...');
    await page.screenshot({
      path: 'main_page_after_login.png',
      fullPage: true
    });

    // Найти и кликнуть на кнопку "Отчеты" в нижней навигации
    console.log('Перехожу в раздел "Отчеты"...');
    
    // Ждем появления кнопки "Отчеты" с иконкой таблицы
    await page.waitForSelector('button:has(i[data-lucide="table"])', { timeout: 10000 });
    const reportsButton = await page.locator('button:has(i[data-lucide="table"])').first();
    
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

    // Найти и кликнуть на кнопку "Заполнить" в нижней навигации
    console.log('Перехожу в раздел "Заполнить"...');
    
    // Ждем появления кнопки "Заполнить" с иконкой редактирования
    await page.waitForSelector('button:has(i[data-lucide="file-edit"])', { timeout: 10000 });
    const fillButton = await page.locator('button:has(i[data-lucide="file-edit"])').first();
    
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

    // Найти и кликнуть на кнопку "Директор" в нижней навигации
    console.log('Перехожу в раздел "Директор"...');
    
    // Ждем появления кнопки "Директор" с иконкой глаза
    await page.waitForSelector('button:has(i[data-lucide="eye"])', { timeout: 10000 });
    const directorButton = await page.locator('button:has(i[data-lucide="eye"])').first();
    
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
takeScreenshots();