require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'database.json');
const CREDENTIALS_FILE = path.join(__dirname, 'data', 'google-credentials.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
    },
    fallthrough: true
}));

// Ensure DB exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '[]');
}

// Helpers
const readData = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const writeData = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Google Sheets Helper
const getGoogleAuth = () => {
    let credentials = null;

    // Check for GOOGLE_CREDENTIALS environment variable (Railway)
    if (process.env.GOOGLE_CREDENTIALS) {
        try {
            credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        } catch (e) {
            console.error('Failed to parse GOOGLE_CREDENTIALS:', e.message);
        }
    }
    // Fallback to file
    else if (fs.existsSync(CREDENTIALS_FILE)) {
        try {
            credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
        } catch (e) {
            console.error('Failed to parse credentials file:', e.message);
        }
    }

    if (!credentials) {
        return null;
    }

    // Use service account
    const auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    return auth;
};

const getSheetsData = async (spreadsheetId, range) => {
    const auth = getGoogleAuth();
    
    if (!auth) {
        throw new Error('Google credentials not configured');
    }
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: range
        });
        
        return response.data.values || [];
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Лист ' + range + ' не найден в таблице');
        }
        throw error;
    }
};

const parseSheetsToReports = (rows) => {
    if (!rows || rows.length === 0) return [];
    
    // Skip header row
    const dataRows = rows.slice(1);
    
    return dataRows.map((row, index) => ({
        id: `sheet-${index}-${Date.now()}`,
        department: row[1] || '',
        report_type: 'weekly',
        period: { week_dates: row[0] || '', is_manual: true },
        kpi_indicators: { deals: { quantity: 0, description: '' }, meetings: { quantity: 0, description: '' }, training: { quantity: 0, description: '' } },
        tasks: row[2] ? [{
            id: `task-${index}`,
            task_text: row[2] || '',
            product: row[4] || '',
            status: mapStatus(row[3] || 'Без статуса'),
            comment: '',
            focus: false
        }] : [],
        unplanned_tasks: [],
        calculated_stats: {
            done: (row[3] || '').toLowerCase().includes('выполнено') ? 1 : 0,
            total: 1,
            percent: (row[3] || '').toLowerCase().includes('выполнено') ? 100 : 0
        },
        created_at: new Date().toISOString(),
        source: 'google-sheets'
    })).filter(r => r.department && r.tasks.length > 0);
};

const mapStatus = (status) => {
    const s = status.toLowerCase();
    if (s.includes('выполнено') || s.includes('готово') || s.includes('done')) return 'Выполнено';
    if (s.includes('работе') || s.includes('progress')) return 'В работе';
    if (s.includes('не выполнено') || s.includes('не готово') || s.includes('pending')) return 'Не выполнено';
    return 'Без статуса';
};

// API Endpoints

// Get all reports
app.get('/api/reports', (req, res) => {
    const reports = readData();
    res.json(reports);
});

// Function to send data to Telegram
async function sendToTelegram(reportData) {
    try {
        let message = `📊 <b>Новый отчет от ${reportData.department}</b>\n\n`;
        message += `🏢 Отдел: ${reportData.department}\n`;
        message += `📅 Период: ${reportData.period.week_dates}\n`;
        message += `📈 Тип отчета: ${reportData.report_type === 'weekly' ? 'Недельный' : 'Месячный'}\n\n`;

        if (reportData.department === 'КД' && reportData.kd_indicators) {
            message += `<b>🎯 Показатели:</b>\n`;
            // ... existing KD indicators code
        } else if (reportData.department !== 'ГИ') {
            message += `<b>🎯 Показатели:</b>\n`;
            if (reportData.kpi_indicators?.deals?.quantity > 0) {
                message += `🔹 Сделки: ${reportData.kpi_indicators.deals.quantity} (${reportData.kpi_indicators.deals.description})\n`;
            }
            if (reportData.kpi_indicators?.meetings?.quantity > 0) {
                message += `🔹 Планерки: ${reportData.kpi_indicators.meetings.quantity} (${reportData.kpi_indicators.meetings.description})\n`;
            }
            if (reportData.kpi_indicators?.training?.quantity > 0) {
                message += `🔹 Обучение: ${reportData.kpi_indicators.training.quantity} (${reportData.kpi_indicators.training.description})\n`;
            }
        }

        if (reportData.tasks?.length > 0) {
            message += `\n<b>✅ Задачи:</b>\n`;
            reportData.tasks.forEach((task, index) => {
                message += `${index + 1}. <b>${task.task_text}</b> - ${task.status}\n`;
                if (task.product) message += `   Результат: ${task.product}\n`;
            });
        }

        if (reportData.unplanned_tasks?.length > 0) {
            message += `\n<b>⚠️ Вне плана:</b>\n`;
            reportData.unplanned_tasks.forEach((task, index) => {
                message += `${index + 1}. <b>${task.task_text}</b> - ${task.status}\n`;
            });
        }

        message += `\n📊 Эффективность: ${reportData.calculated_stats?.percent || 0}%`;

        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;

        if (!telegramBotToken || !telegramChatId) {
            console.log('Telegram credentials not set, skipping send');
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

        await axios.post(telegramApiUrl, {
            chat_id: telegramChatId,
            text: message,
            parse_mode: 'HTML'
        });

        console.log('Successfully sent to Telegram');
    } catch (error) {
        console.error('Error sending to Telegram:', error.message);
    }
}

// Save or Update Report
app.post('/api/reports', async (req, res) => {
    const newReport = req.body;
    let reports = readData();

    const existingIndexById = reports.findIndex(r => r.id === newReport.id);

    if (existingIndexById >= 0) {
        reports[existingIndexById] = newReport;
    } else {
        reports.unshift(newReport);
    }

    writeData(reports);
    sendToTelegram(newReport);

    res.json({ success: true, report: newReport });
});

// Update entire list
app.post('/api/reports/sync', (req, res) => {
    const updatedReports = req.body;
    writeData(updatedReports);
    res.json({ success: true });
});

// Get all sheets in spreadsheet
app.get('/api/sheets/sheets', async (req, res) => {
    const { spreadsheetId } = req.query;
    
    if (!spreadsheetId) {
        return res.json({ success: false, error: 'spreadsheetId is required' });
    }
    
    try {
        const auth = getGoogleAuth();
        if (!auth) {
            return res.json({ success: false, error: 'Google credentials not configured' });
        }
        
        const sheets = google.sheets({ version: 'v4', auth });
        
        const response = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId
        });
        
        const sheetNames = response.data.sheets.map(sheet => ({
            title: sheet.properties.title,
            sheetId: sheet.properties.sheetId,
            index: sheet.properties.index
        }));
        
        res.json({
            success: true,
            sheets: sheetNames
        });
    } catch (error) {
        console.error('Get sheets error:', error.message);
        res.json({ success: false, error: error.message });
    }
});

// Batch request for all departments
app.post('/api/sheets/batch', async (req, res) => {
    const { spreadsheetId, sheetNames } = req.body;

    if (!spreadsheetId || !sheetNames) {
        return res.json({ success: false, error: 'spreadsheetId and sheetNames are required' });
    }

    console.log('Received sheetNames:', sheetNames);

    try {
        const auth = getGoogleAuth();
        if (!auth) {
            return res.json({ success: false, error: 'Google credentials not configured' });
        }

        const sheets = google.sheets({ version: 'v4', auth });

        // Execute batch requests using googleapis with proper async handling
        fs.appendFileSync('debug.log', 'sheetNames received: ' + JSON.stringify(sheetNames) + '\n');

        const batchResults = await Promise.all(
            sheetNames.map(async (sheetName) => {
                fs.appendFileSync('debug.log', 'Processing: ' + sheetName + ' | UTF-8 hex: ' + Buffer.from(sheetName).toString('hex') + '\n');
                
                try {
                    const response = await sheets.spreadsheets.values.get({
                        spreadsheetId: spreadsheetId,
                        range: sheetName
                    }, {
                        headers: {
                            'Accept-Charset': 'utf-8',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    fs.appendFileSync('debug.log', 'Success for ' + sheetName + '\n');
                    return {
                        sheetName: sheetName,
                        success: true,
                        data: response.data.values || []
                    };
                } catch (error) {
                    fs.appendFileSync('debug.log', 'Error for ' + sheetName + ': ' + error.message + '\n');
                    return {
                        sheetName: sheetName,
                        success: false,
                        error: error.message
                    };
                }
            })
        );
        
        res.json({
            success: true,
            results: batchResults
        });
    } catch (error) {
        console.error('Batch request error:', error.message);
        res.json({ success: false, error: error.message });
    }
});

// Google Sheets endpoints
app.post('/api/test', (req, res) => {
    res.json({ success: true, message: 'Test endpoint works' });
});

app.post('/api/sheets/connect', async (req, res) => {
    const { url, sheetName } = req.body;
    
    try {
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            return res.json({ success: false, error: 'Неверная ссылка на таблицу' });
        }
        
        const spreadsheetId = match[1];
        const range = sheetName || 'Sheet1';
        
        // Try to get data from Google Sheets
        const rows = await getSheetsData(spreadsheetId, range);
        const reports = parseSheetsToReports(rows);
        
        res.json({
            success: true,
            title: 'Google Таблица',
            spreadsheetId: spreadsheetId,
            sheetName: range,
            rows: rows.slice(1).map(row =u003e ({
                date: row[0] || '-',
                department: row[1] || '-',
                task: row[2] || '-',
                status: row[3] || '-',
                result: row[4] || '-'
            })),
            reports: reports
        });
    } catch (error) {
        console.error('Sheets connect error:', error.message);
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/sheets/import', async (req, res) => {
    const { url, sheetName } = req.body;
    
    try {
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            return res.json({ success: false, error: 'Неверная ссылка на таблицу' });
        }
        
        const spreadsheetId = match[1];
        const range = sheetName || 'Sheet1';
        
        const rows = await getSheetsData(spreadsheetId, range);
        const reports = parseSheetsToReports(rows);
        
        // Merge with existing reports
        let existingReports = readData();
        reports.forEach(report => {
            const existingIndex = existingReports.findIndex(r => 
                r.source === 'google-sheets' && 
                r.department === report.department &&
                r.period.week_dates === report.period.week_dates
            );
            
            if (existingIndex >= 0) {
                existingReports[existingIndex] = report;
            } else {
                existingReports.unshift(report);
            }
        });
        
        writeData(existingReports);
        
        res.json({
            success: true,
            imported: reports.length,
            reports: existingReports
        });
    } catch (error) {
        console.error('Sheets import error:', error.message);
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/sheets/sync', async (req, res) => {
    // Return current reports from database
    const reports = readData().filter(r => r.source === 'google-sheets');

    res.json({
        success: true,
        rows: reports.map(r => ({
            date: r.period?.week_dates || '-',
            department: r.department || '-',
            task: r.tasks?.[0]?.task_text || '-',
            status: r.tasks?.[0]?.status || '-',
            result: r.tasks?.[0]?.product || '-'
        }))
    });
});

// Remote sync trigger (use token in query string)
// Example: GET /api/sheets/remote-sync?token=YOUR_TOKEN&spreadsheetId=XXX
app.get('/api/sheets/remote-sync', async (req, res) => {
    const SYNC_TOKEN = process.env.SYNC_TOKEN || 'gknzo-sync-2026';
    const { token, spreadsheetId } = req.query;

    if (token !== SYNC_TOKEN) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    if (!spreadsheetId) {
        return res.status(400).json({ success: false, error: 'spreadsheetId required' });
    }

    console.log('Remote sync triggered for:', spreadsheetId);

    try {
        const auth = getGoogleAuth();
        if (!auth) {
            return res.status(500).json({ success: false, error: 'Google credentials not configured' });
        }

        const sheets = google.sheets({ version: 'v4', auth });
        const sheetNames = ['НП', 'ГИ', 'КД', 'РОП', 'РОМ', 'РОПР', 'РСО'];

        const batchResults = await Promise.all(
            sheetNames.map(async (sheetName) => {
                try {
                    const response = await sheets.spreadsheets.values.get({
                        spreadsheetId: spreadsheetId,
                        range: sheetName
                    });
                    return { sheetName, success: true, data: response.data.values || [] };
                } catch (error) {
                    return { sheetName, success: false, error: error.message };
                }
            })
        );

        const summary = {
            total: batchResults.length,
            success: batchResults.filter(r => r.success).length,
            failed: batchResults.filter(r => !r.success).length
        };

        res.json({
            success: true,
            spreadsheetId,
            summary,
            results: batchResults.map(r => ({
                sheetName: r.sheetName,
                success: r.success,
                rowsCount: r.data?.length || 0,
                error: r.error || null
            }))
        });
    } catch (error) {
        console.error('Remote sync error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check Google credentials status
app.get('/api/sheets/status', (req, res) => {
    const hasCredentials = fs.existsSync(CREDENTIALS_FILE);
    res.json({
        configured: hasCredentials,
        message: hasCredentials 
            ? 'Google Sheets API настроен' 
            : 'Google Sheets API не настроен. Добавьте google-credentials.json'
    });
});

// Serve Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { login, password } = req.body;
    const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gknzo123';

    if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
        res.json({ success: true, token: 'authenticated' });
    } else {
        res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Check for credentials
    if (!fs.existsSync(CREDENTIALS_FILE)) {
        console.log('\n⚠️  Google Sheets API не настроен!');
        console.log('📋 Для настройки:');
        console.log('1. Создайте проект в Google Cloud Console');
        console.log('2. Включите Google Sheets API');
        console.log('3. Создайте сервисный аккаунт и скачайте JSON');
        console.log('4. Сохраните его как: data/google-credentials.json');
        console.log('\n📖 Инструкция: https://developers.google.com/sheets/api/quickstart/nodejs\n');
    }
});