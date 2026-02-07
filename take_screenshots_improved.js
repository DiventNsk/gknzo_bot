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

    // Ожидание загрузки основного контента
    await page.waitForTimeout(3000);

    // Сделать скриншот главной страницы после входа
    console.log('Делаю скриншот главной страницы после входа...');
    await page.screenshot({
      path: 'main_page_after_login.png',
      fullPage: true
    });

    // Найти и кликнуть на кнопку "Отчеты" в нижней навигации
    console.log('Перехожу в раздел "Отчеты"...');
    // Попробуем разные возможные селекторы для кнопки "Отчеты"
    let reportsButton = await page.locator('button:has-text("Отчеты")').first();
    
    if (await reportsButton.count() === 0) {
      reportsButton = await page.locator('button:has(i[data-lucide="table"])').first();
    }
    
    if (await reportsButton.count() === 0) {
      reportsButton = await page.locator('.fixed button:nth-child(1)').first();
    }
    
    if (await reportsButton.count() > 0) {
      await reportsButton.click();
      console.log('Кнопка "Отчеты" найдена и нажата');
    } else {
      console.log('Кнопка "Отчеты" не найдена');
    }

    // Ожидание загрузки раздела "Отчеты"
    await page.waitForTimeout(3000);

    // Сделать скриншот раздела "Отчеты"
    console.log('Делаю скриншот раздела "Отчеты"...');
    await page.screenshot({
      path: 'reports_section.png',
      fullPage: true
    });

    // Найти и кликнуть на кнопку "Заполнить" в нижней навигации
    console.log('Перехожу в раздел "Заполнить"...');
    // Попробуем разные возможные селекторы для кнопки "Заполнить"
    let fillButton = await page.locator('button:has-text("Заполнить")').first();
    
    if (await fillButton.count() === 0) {
      fillButton = await page.locator('button:has(i[data-lucide="file-edit"])').first();
    }
    
    if (await fillButton.count() === 0) {
      fillButton = await page.locator('.fixed button:nth-child(2)').first();
    }
    
    if (await fillButton.count() > 0) {
      await fillButton.click();
      console.log('Кнопка "Заполнить" найдена и нажата');
    } else {
      console.log('Кнопка "Заполнить" не найдена');
    }

    // Ожидание загрузки раздела "Заполнить"
    await page.waitForTimeout(3000);

    // Сделать скриншот раздела "Заполнить"
    console.log('Делаю скриншот раздела "Заполнить"...');
    await page.screenshot({
      path: 'fill_section.png',
      fullPage: true
    });

    // Найти и кликнуть на кнопку "Директор" в нижней навигации
    console.log('Перехожу в раздел "Директор"...');
    // Попробуем разные возможные селекторы для кнопки "Директор"
    let directorButton = await page.locator('button:has-text("Директор")').first();
    
    if (await directorButton.count() === 0) {
      directorButton = await page.locator('button:has(i[data-lucide="eye"])').first();
    }
    
    if (await directorButton.count() === 0) {
      directorButton = await page.locator('.fixed button:nth-child(3)').first();
    }
    
    if (await directorButton.count() > 0) {
      await directorButton.click();
      console.log('Кнопка "Директор" найдена и нажата');
    } else {
      console.log('Кнопка "Директор" не найдена');
    }

    // Ожидание загрузки раздела "Директор"
    await page.waitForTimeout(3000);

    // Сделать скриншот раздела "Директор"
    console.log('Делаю скриншот раздела "Директор"...');
    await page.screenshot({
      path: 'director_mode.png',
      fullPage: true
    });

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