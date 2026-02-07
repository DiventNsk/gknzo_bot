const { chromium } = require('playwright');

async function debugInterfaceStructure() {
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

    // Ждем подольше для полной загрузки интерфейса
    console.log('Жду 10 секунд для полной загрузки интерфейса...');
    await page.waitForTimeout(10000);
    
    // Получим HTML-содержимое для анализа
    const html = await page.content();
    console.log('HTML-содержимое страницы (первые 5000 символов):');
    console.log(html.substring(0, 5000));
    console.log('\\n...');
    console.log('HTML-содержимое страницы (следующие 5000 символов):');
    console.log(html.substring(5000, 10000));
    
    // Сделаем скриншот текущего состояния
    console.log('Делаю скриншот текущего состояния...');
    await page.screenshot({
      path: 'debug_current_state.png',
      fullPage: true
    });
    
    // Попробуем найти все кнопки на странице
    const buttons = await page.$$('button');
    console.log(`Найдено ${buttons.length} кнопок на странице`);
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await buttons[i].textContent();
      const buttonClass = await buttons[i].getAttribute('class');
      const buttonOnClick = await buttons[i].getAttribute('onclick');
      console.log(`Кнопка ${i}: текст="${buttonText}", класс="${buttonClass}", onclick="${buttonOnClick}"`);
    }
    
    // Попробуем найти элементы по другим признакам
    const elementsWithTableIcon = await page.$$('i[data-lucide="table"]');
    console.log(`Найдено ${elementsWithTableIcon.length} элементов с иконкой таблицы`);
    
    const elementsWithEditIcon = await page.$$('i[data-lucide="file-edit"]');
    console.log(`Найдено ${elementsWithEditIcon.length} элементов с иконкой редактирования`);
    
    const elementsWithEyeIcon = await page.$$('i[data-lucide="eye"]');
    console.log(`Найдено ${elementsWithEyeIcon.length} элементов с иконкой глаза`);
    
    // Если найдены иконки, попробуем найти родительские кнопки
    if (elementsWithTableIcon.length > 0) {
      console.log('Попытка кликнуть на родительский элемент иконки таблицы');
      await elementsWithTableIcon[0].click();
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: 'after_reports_click.png',
        fullPage: true
      });
    }
    
    // Ждем немного и снова анализируем
    await page.waitForTimeout(5000);
    const htmlAfterClick = await page.content();
    console.log('HTML-содержимое после клика по иконке таблицы (первые 3000 символов):');
    console.log(htmlAfterClick.substring(0, 3000));
    
    // Попробуем вызвать функции напрямую через JavaScript
    console.log('Попытка вызвать navigate("sheets") напрямую');
    await page.evaluate(() => {
      if (typeof navigate === 'function') {
        navigate('sheets');
      }
    });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: 'after_navigate_sheets.png',
      fullPage: true
    });
    
    console.log('Попытка вызвать navigate("create") напрямую');
    await page.evaluate(() => {
      if (typeof navigate === 'function') {
        navigate('create');
      }
    });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: 'after_navigate_create.png',
      fullPage: true
    });
    
    console.log('Попытка вызвать selectDirectorView() напрямую');
    await page.evaluate(() => {
      if (typeof selectDirectorView === 'function') {
        selectDirectorView();
      }
    });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: 'after_select_director_view.png',
      fullPage: true
    });

    console.log('Все скриншоты успешно сделаны с помощью прямого вызова функций!');
    console.log('- debug_current_state.png');
    console.log('- after_reports_click.png');
    console.log('- after_navigate_sheets.png');
    console.log('- after_navigate_create.png');
    console.log('- after_select_director_view.png');
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
debugInterfaceStructure();