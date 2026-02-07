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
    
    // Ожидание загрузки страницы
    await page.waitForTimeout(2000);

    // Проверка, если мы на странице входа, то переходим туда
    if (page.url().includes('/login.html')) {
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

    // Найти и кликнуть на кнопку "Режим директора"
    console.log('Перехожу в режим директора...');
    
    // Ждем немного, чтобы интерфейс полностью загрузился
    await page.waitForTimeout(2000);
    
    // Попробуем разные способы найти кнопку режима директора
    
    // Сначала попробуем найти кнопку через текст "Директор"
    let directorButton = await page.locator('button:has-text("Директор")').first();
    
    if (await directorButton.count() > 0) {
      await directorButton.click();
    } else {
      // Если не найдена кнопка с текстом "Директор", ищем по другим признакам
      // Возможно, это кнопка с иконкой глаза
      directorButton = await page.locator('button:has(i[data-lucide="eye"])').first();
      if (await directorButton.count() > 0) {
        await directorButton.click();
      } else {
        // Ищем кнопку с текстом "Режим директора"
        directorButton = await page.locator('button:has-text("Режим директора")').first();
        if (await directorButton.count() > 0) {
          await directorButton.click();
        } else {
          // Ищем кнопку в нижней навигации по тексту "Директор"
          directorButton = await page.locator('.fixed .touch-manipulation:has-text("Директор")').first();
          if (await directorButton.count() > 0) {
            await directorButton.click();
          } else {
            // Последняя попытка - использовать JavaScript для вызова функции напрямую
            await page.evaluate(() => {
              if (typeof selectDirectorView === 'function') {
                selectDirectorView();
              } else if (typeof window.selectDirectorView === 'function') {
                window.selectDirectorView();
              }
            });
          }
        }
      }
    }

    // Ожидание загрузки режима директора
    await page.waitForTimeout(3000);

    // Сделать скриншот режима директора
    console.log('Делаю скриншот режима директора...');
    await page.screenshot({ 
      path: 'director_mode.png', 
      fullPage: true 
    });

    console.log('Скриншоты успешно сделаны: main_page_after_login.png и director_mode.png');
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