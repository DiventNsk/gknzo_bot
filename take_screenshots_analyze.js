const { chromium } = require('playwright');

async function analyzeAndTakeScreenshots() {
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
    await page.waitForTimeout(5000);

    // Сделать скриншот главной страницы после входа
    console.log('Делаю скриншот главной страницы после входа...');
    await page.screenshot({
      path: 'main_page_after_login.png',
      fullPage: true
    });

    // Вместо ожидания конкретных элементов, получим весь HTML и проанализируем структуру
    const html = await page.content();
    console.log('HTML-структура страницы:');
    console.log(html.substring(0, 2000) + '...'); // Показываем начало HTML
    
    // Попробуем найти навигационные элементы по их атрибутам onclick
    console.log('Поиск элементов навигации по onclick атрибутам...');
    
    // Найти и кликнуть на кнопку "Отчеты" используя onclick
    const reportsBtn = await page.$('button[onclick*="navigate(\'sheets\')"]');
    if (reportsBtn) {
      await reportsBtn.click();
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
      console.log('Кнопка "Отчеты" не найдена по onclick');
    }

    // Найти и кликнуть на кнопку "Заполнить" используя onclick
    const fillBtn = await page.$('button[onclick*="navigate(\'create\')"]');
    if (fillBtn) {
      await fillBtn.click();
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
      console.log('Кнопка "Заполнить" не найдена по onclick');
    }

    // Найти и кликнуть на кнопку "Директор" используя onclick
    const directorBtn = await page.$('button[onclick*="selectDirectorView()"]');
    if (directorBtn) {
      await directorBtn.click();
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
      console.log('Кнопка "Директор" не найдена по onclick');
    }

    console.log('Попытка найти элементы навигации по тексту...');
    
    // Если предыдущие методы не сработали, пробуем найти по тексту
    const navButtons = await page.$$('.fixed button');
    console.log(`Найдено ${navButtons.length} элементов в нижней навигации`);
    
    if (navButtons.length >= 3) {
      // Клик по первому элементу ("Отчеты")
      await navButtons[0].click();
      console.log('Клик по первому элементу навигации (Отчеты)');
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: 'reports_section_alt.png',
        fullPage: true
      });
      
      // Клик по второму элементу ("Заполнить")
      await navButtons[1].click();
      console.log('Клик по второму элементу навигации (Заполнить)');
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: 'fill_section_alt.png',
        fullPage: true
      });
      
      // Клик по третьему элементу ("Директор")
      await navButtons[2].click();
      console.log('Клик по третьему элементу навигации (Директор)');
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: 'director_mode_alt.png',
        fullPage: true
      });
    }

    console.log('Все скриншоты успешно сделаны!');
    console.log('- main_page_after_login.png');
    console.log('- reports_section.png / reports_section_alt.png');
    console.log('- fill_section.png / fill_section_alt.png');
    console.log('- director_mode.png / director_mode_alt.png');
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
analyzeAndTakeScreenshots();