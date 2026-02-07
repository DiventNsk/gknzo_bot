# Практические примеры интеграции навыков в проект gknzo_bot

## 1. Улучшение доступности (Accessibility)

### Внесение изменений в HTML
В файле `public/index.html` добавим ARIA-атрибуты и улучшим семантическую разметку:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Report Generator (Express)</title>
    <!-- ... остальные теги ... -->
</head>
<body class="bg-white font-sans text-slate-900 pb-20">
    <header role="banner" aria-label="Навигация">
        <nav role="navigation" aria-label="Основная навигация">
            <!-- Навигационные элементы -->
        </nav>
    </header>
    
    <main id="app" role="main" aria-label="Основное содержимое">
        <!-- Контент приложения -->
    </main>
    
    <footer role="contentinfo" aria-label="Информация о приложении">
        <!-- Информация о приложении -->
    </footer>
    
    <script src="script.js"></script>
</body>
</html>
```

## 2. Улучшение интерфейса в режиме директора

В файле `public/script.js` улучшим компонент режима директора:

```javascript
const renderDirectorView = () => {
    const reports = state.history.filter(r => r.report_type === state.reportType);
    const outstandingTasks = getOutstandingTasks();

    const totalTasks = reports.reduce((sum, r) => sum + (r.calculated_stats?.total || 0), 0);
    const doneTasks = reports.reduce((sum, r) => sum + (r.calculated_stats?.done || 0), 0);
    const avgPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const overdueCount = outstandingTasks.length;

    let content = `
    <div class="animate-fade-in pb-24">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-300">
            <div>
                <h1 class="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight" aria-label="Режим директора">Режим директора</h1>
                <p class="text-xs text-slate-500 mt-0.5">Обзор всех отчётов</p>
            </div>
            <button onclick="navigate('select-dept')" class="text-xs font-bold uppercase text-slate-500 hover:text-slate-800 tracking-wide flex items-center gap-1" aria-label="Вернуться к выбору отдела">
                <i data-lucide="arrow-left" class="w-3 h-3"></i> Назад
            </button>
        </div>

        <!-- Добавим карточки с метриками -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div class="bg-white border border-slate-200 p-4 text-center shadow-sm rounded-lg" role="region" aria-labelledby="reports-count">
                <div class="text-3xl font-bold text-slate-900" id="reports-count">${reports.length}</div>
                <div class="text-sm uppercase tracking-wide text-slate-500 mt-1">Отчётов</div>
            </div>
            <div class="bg-white border border-slate-200 p-4 text-center shadow-sm rounded-lg" role="region" aria-labelledby="avg-percent">
                <div class="text-3xl font-bold ${avgPercent >= 70 ? 'text-green-600' : (avgPercent >= 40 ? 'text-amber-600' : 'text-red-600')}" id="avg-percent">${avgPercent}%</div>
                <div class="text-sm uppercase tracking-wide text-slate-500 mt-1">Средний %</div>
            </div>
            <div class="${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border p-4 text-center shadow-sm rounded-lg" role="region" aria-labelledby="focus-count">
                <div class="text-3xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-green-600'}" id="focus-count">${overdueCount}</div>
                <div class="text-sm uppercase tracking-wide ${overdueCount > 0 ? 'text-red-600' : 'text-green-600'} mt-1">В фокусе</div>
            </div>
        </div>

        <!-- Остальная часть интерфейса -->
        <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2" id="attention-required">
                    <i data-lucide="alert-circle" class="w-5 h-5 text-red-500"></i>
                    Требуют внимания
                </h3>
                ${overdueCount > 0 ? `<span class="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold" aria-label="Количество задач требующих внимания">${overdueCount}</span>` : ''}
            </div>
            ${outstandingTasks.length === 0 ?
            `<div class="text-center py-4 bg-green-50 border border-green-200 text-green-700 text-sm font-bold uppercase rounded flex items-center justify-center gap-1" role="status" aria-live="polite">
                <i data-lucide="check-circle" class="w-5 h-5"></i> Всё в порядке
            </div>` :
            `<div class="space-y-3" role="list" aria-label="Список задач требующих внимания">${outstandingTasks.map(task => renderOutstandingTaskCompact(task)).join('')}</div>`}
        </div>

        <div>
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2" id="all-reports">
                    <i data-lucide="folder" class="w-5 h-5 text-blue-500"></i>
                    Все отчёты
                </h3>
                <span class="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-bold" aria-label="Общее количество отчётов">${reports.length}</span>
            </div>
            ${reports.length === 0 ?
            `<div class="text-center py-8 bg-slate-50 border border-slate-200 text-slate-400 text-sm font-bold uppercase rounded flex items-center justify-center gap-1" role="status" aria-live="polite">
                <i data-lucide="inbox" class="w-5 h-5"></i> Отчётов пока нет
            </div>` :
            `<div class="space-y-3" role="list" aria-label="Список всех отчётов">${reports.map(report => renderReportItemCompact(report)).join('')}</div>`}
        </div>
    </div>`;

    return content;
};
```

## 3. Улучшение адаптивности

Добавим улучшенные медиа-запросы в CSS:

```css
/* В файле public/index.html в теге <style> */

/* Улучшенные медиа-запросы для адаптивности */
@media (max-width: 640px) {
    .safe-area-pb {
        padding-bottom: env(safe-area-inset-bottom, 20px);
    }
    
    /* Улучшенные стили для мобильных устройств */
    input[type="number"], 
    input[type="text"], 
    textarea, 
    select {
        font-size: 16px !important;
        -webkit-appearance: none;
        border-radius: 0;
        min-height: 44px; /* Минимальный размер для касания */
    }
    
    button {
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        min-height: 44px;
    }
    
    .touch-manipulation {
        touch-action: manipulation;
    }
    
    .min-h-screen {
        min-height: 100dvh;
    }
    
    /* Улучшенная навигация для мобильных */
    .mobile-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-top: 2px solid #1e293b;
        z-index: 50;
        display: flex;
        justify-content: space-around;
        padding: 0.5rem;
    }
    
    .mobile-nav button {
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.75rem;
        width: 100%;
        font-size: 0.75rem;
        line-height: 1rem;
    }
    
    .mobile-nav i {
        margin-bottom: 0.25rem;
    }
}

/* Дополнительные стили для улучшения доступности */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* Темная тема (если поддерживается) */
@media (prefers-color-scheme: dark) {
    body {
        background-color: #1e293b;
        color: #f1f5f9;
    }
}
```

## 4. Улучшение тестирования

Создадим улучшенный скрипт для тестирования:

```javascript
// Файл test_enhanced_ui.js
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Переход на главную страницу
        await page.goto('http://localhost:3000');
        
        // Проверка заголовка
        await page.waitForSelector('title');
        const title = await page.title();
        console.log('Заголовок страницы:', title);
        
        // Проверка доступности основных элементов
        const appExists = await page.$('#app');
        console.log('Элемент #app существует:', !!appExists);
        
        // Проверка наличия элементов навигации
        const navButtons = await page.$$('.mobile-nav button');
        console.log('Количество кнопок навигации:', navButtons.length);
        
        // Проверка доступности режима директора
        await page.evaluate(() => {
            window.state = { view: 'director' };
            window.render();
        });
        
        // Сделать скриншот
        await page.screenshot({ path: 'enhanced_test_screenshot.png' });
        
        console.log('Тестирование завершено успешно');
    } catch (error) {
        console.error('Ошибка при тестировании:', error);
    } finally {
        await browser.close();
    }
})();
```

Эти примеры показывают, как можно интегрировать лучшие практики из найденных навыков в ваш проект gknzo_bot.