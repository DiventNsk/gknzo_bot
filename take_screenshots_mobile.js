const { chromium } = require('playwright');

async function takeScreenshotsMobileView() {
  let browser;
  try {
    // Запуск браузера в безголовом режиме с мобильными размерами
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Устанавливаем размер экрана как у мобильного устройства
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone размер

    // Переход на главную страницу
    console.log('Открываю главную страницу в мобильном виде...');
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
    
    // Сделаем скриншот главной страницы
    console.log('Делаю скриншот главной страницы...');
    await page.screenshot({
      path: 'main_page_mobile.png'
    });

    // Теперь должны появиться навигационные кнопки, так как у нас мобильный размер
    console.log('Поиск навигационных кнопок в мобильном виде...');
    
    // Ждем появление навигационной панели
    await page.waitForSelector('.fixed.bottom-0', { timeout: 10000 });
    console.log('Навигационная панель найдена');
    
    // Проверим количество кнопок в навигации
    const navButtons = await page.$$('.fixed.bottom-0 button');
    console.log(`Найдено ${navButtons.length} кнопок в навигационной панели`);
    
    // Сделаем скриншот с навигацией
    console.log('Делаю скриншот с навигационной панелью...');
    await page.screenshot({
      path: 'main_with_nav_mobile.png'
    });

    // Теперь кликаем по кнопкам навигации
    if (navButtons.length >= 3) {
      // Клик по первой кнопке ("Отчеты")
      console.log('Клик по кнопке "Отчеты" (первая кнопка)');
      await navButtons[0].click();
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: 'reports_section_mobile.png'
      });
      
      // Клик по второй кнопке ("Заполнить")
      console.log('Клик по кнопке "Заполнить" (вторая кнопка)');
      await navButtons[1].click();
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: 'fill_section_mobile.png'
      });
      
      // Клик по третьей кнопке ("Директор")
      console.log('Клик по кнопке "Директор" (третья кнопка)');
      await navButtons[2].click();
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: 'director_mode_mobile.png'
      });
    } else {
      console.log('Недостаточно кнопок в навигационной панели');
      
      // Попробуем вызвать функции напрямую
      console.log('Попытка вызвать navigate("sheets") напрямую');
      await page.evaluate(() => {
        if (typeof navigate === 'function') {
          navigate('sheets');
        }
      });
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: 'reports_section_direct_call.png'
      });
      
      console.log('Попытка вызвать navigate("create") напрямую');
      await page.evaluate(() => {
        if (typeof navigate === 'function') {
          navigate('create');
        }
      });
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: 'fill_section_direct_call.png'
      });
      
      console.log('Попытка вызвать selectDirectorView() напрямую');
      await page.evaluate(() => {
        if (typeof selectDirectorView === 'function') {
          selectDirectorView();
        }
      });
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: 'director_mode_direct_call.png'
      });
    }

    console.log('Все скриншоты успешно сделаны!');
    console.log('- main_page_mobile.png');
    console.log('- main_with_nav_mobile.png');
    console.log('- reports_section_mobile.png');
    console.log('- fill_section_mobile.png');
    console.log('- director_mode_mobile.png');
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
takeScreenshotsMobileView();