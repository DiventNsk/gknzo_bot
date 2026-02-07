const { chromium } = require('playwright');

async function waitForFullLoadAndTakeScreenshots() {
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

    // Ждем полной загрузки интерфейса
    console.log('Жду полной загрузки интерфейса...');
    
    // Ждем появление элемента с id="app" и его содержимого
    await page.waitForSelector('#app', { state: 'attached', timeout: 10000 });
    await page.waitForFunction(() => {
      const appElement = document.getElementById('app');
      return appElement && appElement.children.length > 0;
    }, {}, { timeout: 15000 });
    
    console.log('Интерфейс загружен, делаю скриншот главной страницы...');
    await page.screenshot({
      path: 'main_page_after_login.png',
      fullPage: true
    });

    // Ждем появление навигационной панели внизу
    console.log('Жду появления навигационной панели...');
    await page.waitForSelector('.fixed.bottom-0', { timeout: 15000 });
    
    // Проверим, что внутри навигации есть кнопки
    await page.waitForFunction(() => {
      const navContainer = document.querySelector('.fixed.bottom-0');
      return navContainer && navContainer.querySelectorAll('button').length >= 3;
    }, {}, { timeout: 10000 });

    // Сделаем скриншот всей страницы до навигации
    console.log('Делаю дополнительный скриншот с навигацией...');
    await page.screenshot({
      path: 'with_navigation.png',
      fullPage: true
    });

    // Теперь пробуем кликать по кнопкам навигации
    console.log('Поиск и клик по кнопке "Отчеты" (первая кнопка в навигации)...');
    const navButtons = await page.$$('.fixed.bottom-0 button');
    console.log(`Найдено ${navButtons.length} кнопок в навигации`);
    
    if (navButtons.length >= 3) {
      // Первая кнопка - "Отчеты"
      await navButtons[0].click();
      console.log('Кнопка "Отчеты" нажата');
      
      // Ждем загрузки содержимого
      await page.waitForTimeout(3000);
      
      // Сделать скриншот раздела "Отчеты"
      console.log('Делаю скриншот раздела "Отчеты"...');
      await page.screenshot({
        path: 'reports_section.png',
        fullPage: true
      });
      
      // Вторая кнопка - "Заполнить"
      await navButtons[1].click();
      console.log('Кнопка "Заполнить" нажата');
      
      // Ждем загрузки содержимого
      await page.waitForTimeout(3000);
      
      // Сделать скриншот раздела "Заполнить"
      console.log('Делаю скриншот раздела "Заполнить"...');
      await page.screenshot({
        path: 'fill_section.png',
        fullPage: true
      });
      
      // Третья кнопка - "Директор"
      await navButtons[2].click();
      console.log('Кнопка "Директор" нажата');
      
      // Ждем загрузки содержимого
      await page.waitForTimeout(3000);
      
      // Сделать скриншот раздела "Директор"
      console.log('Делаю скриншот раздела "Директор"...');
      await page.screenshot({
        path: 'director_mode.png',
        fullPage: true
      });
    } else {
      console.log('Недостаточно кнопок в навигации. Повторный поиск...');
      
      // Попробуем найти кнопки по тексту
      const reportsButton = await page.locator('button:has-text("Отчеты")').first();
      if (await reportsButton.count() > 0) {
        await reportsButton.click();
        console.log('Кнопка "Отчеты" найдена и нажата');
        await page.waitForTimeout(3000);
        await page.screenshot({
          path: 'reports_section_by_text.png',
          fullPage: true
        });
      }
      
      const fillButton = await page.locator('button:has-text("Заполнить")').first();
      if (await fillButton.count() > 0) {
        await fillButton.click();
        console.log('Кнопка "Заполнить" найдена и нажата');
        await page.waitForTimeout(3000);
        await page.screenshot({
          path: 'fill_section_by_text.png',
          fullPage: true
        });
      }
      
      const directorButton = await page.locator('button:has-text("Директор")').first();
      if (await directorButton.count() > 0) {
        await directorButton.click();
        console.log('Кнопка "Директор" найдена и нажата');
        await page.waitForTimeout(3000);
        await page.screenshot({
          path: 'director_mode_by_text.png',
          fullPage: true
        });
      }
    }

    console.log('Все скриншоты успешно сделаны!');
    console.log('- main_page_after_login.png');
    console.log('- with_navigation.png');
    console.log('- reports_section.png / reports_section_by_text.png');
    console.log('- fill_section.png / fill_section_by_text.png');
    console.log('- director_mode.png / director_mode_by_text.png');
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
waitForFullLoadAndTakeScreenshots();