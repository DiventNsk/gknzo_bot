# Структура приложения gknzo_bot

## Файлы

### server.js (Backend)
- `/api/sheets/batch` - массовая загрузка данных из Google Sheets
- `/api/sheets/remote-sync` - удалённая синхронизация (токен в SYNC_TOKEN)
- `/api/login` - авторизация (логин/пароль из переменных)
- Google credentials: из `data/google-credentials.json` или переменной `GOOGLE_CREDENTIALS`

### public/login.html
Страница входа в систему
- Поля: логин, пароль
- При успехе: сохраняет токен в localStorage и редиректит на главную
- При ошибке: показывает сообщение

### public/script.js (Frontend)

#### Авторизация (строки 1-15)
`checkAuth()` - проверяет наличие токена в localStorage
- Если токена нет: редирект на `/login.html`
- `logout()` - выход из системы (удаляет токен, редирект на login.html)

#### Авторизация (строки 1-15)
`checkAuth()` - проверяет наличие токена в localStorage
- Если токена нет: редирект на `/login.html`
- `logout()` - выход из системы (удаляет токен, редирект на login.html)

#### 1. Главный дашборд Google Sheets (строка ~138)
`renderGoogleSheetsDashboard()`
- Дата в заголовке (строка 162): `new Date().toLocaleDateString('ru-RU', ...)`
- Кнопки отделов (строки 166-180): `defaultSheetNames = ['НП', 'ГИ', 'КД', 'РОП', 'РОМ', 'РОПР', 'РСО']`
- **Статистика удалена** (была строки 141-194)

#### 2. Переключение отделов (строки 256-274)
`switchDepartment(dept)` - переключает активный отдел
- Обновляет кнопки с классом `.department-btn`
- Обновляет заголовок `deptTitle`
- Вызывает `renderDepartmentData(dept)`

#### 3. Выбор вкладки (строки 1158-1176)
`selectDepartmentTab(sheetName)` - альтернативная функция переключения

#### 4. Загрузка данных (строки 1125-1157)
`loadAllDepartments()` - загружает все отделы через `/api/sheets/batch`

#### 5. Рендер данных отдела (строки ~1356-1415)
`renderDepartmentData(department)`
- **Статистика удалена** (была `departmentStats`)
- Список задач по неделям
- Парсинг дат: `DD.MM-DD.MM.YY` (с годом)
- Сортировка недель: свежие сверху

#### 6. Парсинг задач (строки ~1326-1353)
`parseTaskRow(row, format)` - формат колонок для каждого отдела:
- `np`: task=row[1], product=row[2], comment=row[4], status=row[3]
- `gi`: task=row[1], product=row[2], comment=row[3], status=row[4]
- `kd`: task=row[2], product=row[3], comment=row[4], status=row[5]
- `rop`: task=row[1], product=row[6], comment=row[7], status=row[9]
- `rom`: special format (показатели)
- `ropr`: task=row[1], product=row[6], comment=row[9], status=row[10]
- `rso`: task=row[1], product=row[2], comment=row[3], status=row[4]

#### 8. Авторизация (строки 1-15)
`checkAuth()` - проверяет наличие токена в localStorage
- Если токена нет: редирект на `/login.html`
- `logout()` - выход из системы (удаляет токен, редирект на login.html)
- `init()` - добавляет проверку `checkAuth()` при загрузке

#### 9. Страница входа (public/login.html)
- Простая форма с логином и паролем
- Отправляет POST на `/api/login`
- При успехе: localStorage.setItem('authToken', 'authenticated')
- Редирект на главную страницу
`parseWeekDate()` - парсит дату недели для сортировки
- Формат: `DD.MM-DD.MM.YY`

## Быстрые ссылки

| Функция | Файл | Строка |
|---------|------|--------|
| Авторизация | script.js | `checkAuth()` 1-10 |
| Выход из системы | script.js | `logout()` 14 |
| Страница входа | login.html | новый файл |
| API авторизации | server.js | `/api/login` |
| Главный дашборд | script.js | `renderGoogleSheetsDashboard()` ~138 |
| Кнопки отделов | script.js | `defaultSheetNames` ~139 |
| Переключение отделов | script.js | `switchDepartment()` 256-274 |
| Заголовок отдела | script.js | `deptTitle` (строка 186) |
| API синхронизация | server.js | `/api/sheets/batch` |

## Google Sheets формат

### НП (Неделя)
```
["№","ЗАДАЧИ","ПРОДУКТ","РЕЗУЛЬТАТ","КОММЕНТАРИЙ"]
["1","Задача","процесс","Выполнено","комментарий"]
```

### ГИ
```
["№","Задача","","РЕЗУЛЬТАТ","КОММЕНТАРИЙ","ИТОГ"]
["1","Задача","","процесс","комментарий","В работе"]
```

## Переменные окружения (Railway)
- `GOOGLE_CREDENTIALS` - JSON сервисного аккаунта
- `SYNC_TOKEN` - токен для удалённой синхронизации
- `ADMIN_LOGIN` - логин администратора (по умолчанию: admin)
- `ADMIN_PASSWORD` - пароль администратора (по умолчанию: gknzo123)
- `PORT` - порт (по умолчанию 3000)

## Логин/пароль (изменяемые)
По умолчанию: `admin` / `gknzo123`
Изменяются через переменные окружения:
- `ADMIN_LOGIN`
- `ADMIN_PASSWORD`

---

# Инструкция по деплою на Railway

## Шаг 1: Подготовка репозитория

```bash
# Клонировать репозиторий (если ещё не клонирован)
git clone https://github.com/DiventNsk/gknzo_bot.git
cd gknzo_bot
```

## Шаг 2: Настройка переменных окружения на Railway

1. Зайти на https://railway.app/project/gknzo_bot-production
2. Перейти в **Settings** → **Variables**
3. Добавить следующие переменные:

### Обязательные:
```
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```
Содержимое файла `data/google-credentials.json` в одну строку

### Рекомендуемые (изменить значения!):
```
ADMIN_LOGIN=ваш_логин
ADMIN_PASSWORD=ваш_надежный_пароль
SYNC_TOKEN=ваш_токен_для_синхронизации
```

### Опциональные:
```
PORT=3000
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

## Шаг 3: Деплой

1. На Railway нажать **Deploy** → **Redeploy**
2. Дождаться завершения деплоя
3. Проверить логи на ошибки

## Шаг 4: Проверка

1. Открыть `https://gknzobot-production.up.railway.app/`
2. Должна открыться страница входа
3. Ввести логин/пароль из переменных
4. Проверить загрузку данных из Google Sheets

## Если не работает:

### Ошибка 401 при входе:
- Проверить переменные `ADMIN_LOGIN` и `ADMIN_PASSWORD` на Railway
- Перезадеплоить после изменения переменных

### Ошибка Google Sheets:
- Проверить `GOOGLE_CREDENTIALS` - должен быть JSON сервисного аккаунта
- Проверить что таблица расшарена для email из credentials

### Ошибка соединения:
- Проверить логи на Railway (Deploy → Logs)

## Структура файлов для деплоя

```
gknzo_bot/
├── server.js              # Backend
├── package.json           # Зависимости
├── .env                   # Локальные переменные (не коммитить!)
├── data/
│   ├── database.json     # База данных
│   └── google-credentials.json  # Google API (не коммитить!)
├── public/
│   ├── index.html        # Главная страница
│   ├── login.html        # Страница входа
│   ├── script.js         # Frontend логика
│   └── lucide.js         # Icons (локально)
└── STRUCTURE.md           # Эта документация
```

## Важно

- **НЕ коммитить** `.env` и `google-credentials.json` в git
- Все sensitive данные хранить в переменных окружения Railway
- После изменения переменных - обязательно **передеплоить**

## Локальный запуск

```bash
# Установить зависимости
npm install

# Запустить
npm start

# Или
node server.js
```

Открыть http://localhost:3000
