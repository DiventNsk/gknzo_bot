const { chromium } = require('playwright');

(async () => {
    // Запуск браузера в безголовом режиме
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Установка размера окна для лучшего скриншота
        await page.setViewportSize({ width: 1280, height: 800 });

        // Переход на главную страницу приложения
        await page.goto('http://localhost:3000');

        // Ждем загрузки страницы
        await page.waitForTimeout(2000);

        // Ввод логина и пароля (по умолчанию admin/gknzo123)
        await page.fill('#login', 'admin');
        await page.fill('#password', 'gknzo123');
        
        // Нажатие кнопки входа
        await page.click('button[type="submit"]');
        
        // Ждем перехода на главную страницу после входа
        await page.waitForURL('http://localhost:3000/');
        await page.waitForTimeout(3000);

        // Делаем скриншот главной страницы
        await page.screenshot({ 
            path: 'main_page_after_login.png', 
            fullPage: true 
        });

        console.log('Скриншот главной страницы после входа сохранен как main_page_after_login.png');

        // Теперь попробуем найти кнопку "Режим директора" среди нижней навигации
        // На основе кода в script.js, кнопка "Директор" имеет onclick="selectDirectorView()"
        // Она также может быть в нижней навигации с иконкой "eye"
        
        // Попробуем найти элементы в нижней части экрана
        const footerButtons = await page.$$('.fixed.bottom-0 button');
        console.log(`Найдено ${footerButtons.length} кнопок в нижнем меню`);

        if (footerButtons.length > 0) {
            for (let i = 0; i < footerButtons.length; i++) {
                const buttonText = await footerButtons[i].textContent();
                console.log(`Нижняя кнопка ${i}: ${buttonText}`);
            }
            
            // Попробуем кликнуть на последнюю кнопку (обычно это "Директор")
            if (footerButtons.length >= 3) {
                await footerButtons[2].click(); // Предполагаем, что третья кнопка - это "Директор"
                await page.waitForTimeout(2000);

                // Делаем скриншот интерфейса директора
                await page.screenshot({ 
                    path: 'director_mode_screenshot.png', 
                    fullPage: true 
                });

                console.log('Скриншот интерфейса в режиме директора сохранен как director_mode_screenshot.png');
            }
        } else {
            // Если нет нижних кнопок, попробуем вызвать функцию напрямую через JavaScript
            await page.evaluate(() => {
                if (typeof selectDirectorView === 'function') {
                    selectDirectorView();
                } else {
                    console.log('Функция selectDirectorView не найдена');
                }
            });
            
            await page.waitForTimeout(2000);

            // Делаем скриншот интерфейса директора
            await page.screenshot({ 
                path: 'director_mode_screenshot.png', 
                fullPage: true 
            });

            console.log('Скриншот интерфейса в режиме директора сохранен как director_mode_screenshot.png');
        }

        // Закрываем браузер
        await browser.close();

        // Возвращаем информацию об интерфейсе
        console.log('Браузер закрыт');
    } catch (error) {
        console.error('Ошибка при автоматизации:', error);
        
        // Попробуем сделать скриншот текущей страницы для диагностики
        try {
            await page.screenshot({ 
                path: 'debug_screenshot.png'
            });
            console.log('Скриншот для отладки сохранен как debug_screenshot.png');
        } catch (screenshotError) {
            console.error('Ошибка при создании скриншота отладки:', screenshotError);
        }
        
        await browser.close();
    }
})();