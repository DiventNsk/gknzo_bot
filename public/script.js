// --- AUTH CHECK ---
const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    if (!token || token !== 'authenticated') {
        window.location.href = '/login.html';
        return false;
    }
    return true;
};

// Logout function
window.logout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
};

// Switch Korsovet/Plan Dnya mode
window.switchKorsovetMode = (mode) => {
    const previousMode = state.korsovetMode;
    state.korsovetMode = mode;
    state.expandedTasks = {};

    if (mode === 'plan_dnya') {
        loadDirectorPlanData();
    } else if (previousMode === 'plan_dnya') {
        loadAllDepartments();
    } else {
        render();
    }
};

// Функция для загрузки данных из таблицы "План дня руководителя"
window.loadDirectorPlanData = async () => {
    const directorPlanSpreadsheetId = '1LkYUZd5GlXixA8igGsjtQ-GFhEVqH2N1tU9x2vmJNDQ';
    const sheetNames = ['НП', 'ГИ', 'КД', 'РОП', 'РОМ', 'РОПР', 'РСО'];

    try {
        const response = await fetch('/api/sheets/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                spreadsheetId: directorPlanSpreadsheetId,
                sheetNames: sheetNames
            })
        });

        const data = await response.json();

        if (data.success) {
            // Обновляем данные отделов новыми данными из таблицы "План дня руководителя"
            data.results.forEach(result => {
                if (result.success) {
                    departmentsData[result.sheetName] = parseDepartmentData(result.data, result.sheetName);
                }
            });

            // Обновляем интерфейс
            render();
        } else {
            console.error('Ошибка загрузки данных из таблицы План дня руководителя:', data.error);
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных из таблицы План дня руководителя:', error);
    }
};

// --- UTILS ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const getWeekRange = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const format = d => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
    return `${format(monday)} - ${format(friday)}`;
};

const checkDeadline = () => {
    const d = new Date();
    const day = d.getDay();
    const hour = d.getHours();
    const isFriday = day === 5;
    const isAfterDeadline = hour >= 17;
    state.deadlinePassed = isFriday && isAfterDeadline;
};

// State
const state = {
    reportType: 'weekly',
    korsovetMode: 'korsovet',
    statusFilter: 'all',
    period: { week_dates: getWeekRange(), is_manual: false },
    history: [],
    view: 'sheets',
    deadlinePassed: false,
    expandedTasks: {}
};

const DEPARTMENTS = ['НП', 'РОП', 'ГИ', 'ТД', 'ИТОП', 'КД', 'РОМ', 'РОПР', 'РСО', 'СЛ', 'РТКО', 'тест'];
const STATUS_OPTIONS = [
    { value: 'Выполнено', label: '✓ Выполнено', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'В работе', label: '⟳ В работе', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'Не выполнено', label: '✕ Не выполнено', color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'Без статуса', label: '○ Без статуса', color: 'bg-slate-100 text-slate-700 border-slate-200' }
];

// --- API ---
const api = {
    fetchReports: async () => {
        try {
            const res = await fetch('/api/reports');
            state.history = await res.json();
        } catch (e) { console.error(e); }
    },
    syncReports: async (reports) => {
        try {
            await fetch('/api/reports/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reports)
            });
        } catch (e) { console.error(e); }
    }
};

// --- ACTIONS ---
window.updatePeriod = (val) => { state.period.week_dates = val; };
window.toggleType = (type) => { state.reportType = type; };
window.selectDirectorView = async () => {
    state.view = 'director';
    await api.fetchReports();
    render();
};
window.navigate = async (view) => {
    state.view = view;
    if (view === 'sheets') {
        await loadAllDepartments();
    } else {
        await api.fetchReports();
    }
    render();
};

window.selectDirectorView = async () => {
    state.view = 'director';
    await api.fetchReports();
    render();
};

const renderMainDashboard = () => {
    return renderGoogleSheetsDashboard();
};

const renderGoogleSheetsDashboard = () => {
    const defaultSheetNames = ['НП', 'ГИ', 'КД', 'РОМ', 'РОПР', 'РСО'];
    
    return `
    <div class="animate-fade-in-up">
        <div class="flex flex-row justify-between items-center mb-4 pb-3 border-b border-slate-200">
            <div class="flex flex-col">
                <h1 class="text-xl font-bold text-slate-900 tracking-tight" role="banner">${state.korsovetMode === 'korsovet' ? 'Корсовет' : 'План дня'}</h1>
                <p class="text-sm text-slate-500">${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <button
                onclick="loadAllDepartments()"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl flex items-center gap-2 transition-all duration-200 shadow-soft hover:shadow-lg transform active:scale-[0.98]"
                aria-label="Обновить данные"
                tabindex="0">
                <i data-lucide="refresh-cw" class="w-4 h-4" aria-hidden="true"></i>
                <span class="hidden sm:inline">Обновить</span>
            </button>
        </div>

        <div class="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden mb-4" role="region" aria-labelledby="mode-selector">
            <div class="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-center">
                <div class="flex gap-1 p-1 bg-slate-100 rounded-lg" id="mode-selector">
                    <button 
                        onclick="switchKorsovetMode('korsovet')" 
                        class="px-5 py-2 text-sm font-medium rounded-md transition-all ${state.korsovetMode === 'korsovet' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}" 
                        aria-pressed="${state.korsovetMode === 'korsovet'}"
                        tabindex="0">
                        Корсовет
                    </button>
                    <button 
                        onclick="switchKorsovetMode('plan_dnya')" 
                        class="px-5 py-2 text-sm font-medium rounded-md transition-all ${state.korsovetMode === 'plan_dnya' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}" 
                        aria-pressed="${state.korsovetMode === 'plan_dnya'}"
                        tabindex="0">
                        План дня
                    </button>
                </div>
            </div>

            <div class="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2">
                <span class="text-xs text-slate-500">${Object.keys(departmentsData).length} из ${defaultSheetNames.length} загружено</span>
            </div>
            <div class="p-3">
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2" id="departmentGrid">
                    ${defaultSheetNames.map(sheet => {
                        const deptData = departmentsData[sheet] || { stats: { total: 0 } };
                        return `
                            <button onclick="switchDepartment('${sheet}')" class="department-btn p-3 rounded-xl border-2 border-slate-100 hover:border-green-400 hover:bg-green-50/50 transition-all text-center cursor-pointer ${currentDepartment === sheet ? 'border-green-500 bg-green-50' : ''}" data-dept="${sheet}">
                                <div class="font-semibold text-slate-900">${sheet}</div>
                                <div class="text-xs text-slate-500 mt-0.5">${deptData.stats?.total || 0}</div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
            <div class="overflow-x-auto custom-scrollbar">
                ${state.korsovetMode === 'plan_dnya' ? `
                    <div class="mb-4">
                        <select id="statusFilterSelect" onchange="setStatusFilter(this.value)" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer shadow-soft">
                            <option value="all" ${state.statusFilter === 'all' ? 'selected' : ''}>📋 Все</option>
                            <option value="done" ${state.statusFilter === 'done' ? 'selected' : ''}>✓ Выполнено</option>
                            <option value="in_progress" ${state.statusFilter === 'in_progress' ? 'selected' : ''}>⟳ В работе</option>
                            <option value="not_done" ${state.statusFilter === 'not_done' ? 'selected' : ''}>✕ Не выполнено</option>
                        </select>
                    </div>
                    ${renderAllDepartmentsTasks()}
                ` : renderDepartmentTasks(currentDepartment)}
            </div>
        </div>
    </div>
`;
};

// Функция для отображения задач всех отделов в режиме "План дня руководителя"
const renderAllDepartmentsTasks = () => {
    let allTasksHtml = '';

    // Собираем задачи из всех отделов
    for (const [deptName, deptData] of Object.entries(departmentsData)) {
        if (deptData && deptData.weeks && deptData.weeks.length > 0) {
            // В режиме "План дня" задачи не разделены по неделям, объединяем все задачи
            const allTasks = deptData.weeks.flatMap(week => week.tasks);
            const filteredTasks = filterTasksByStatus(allTasks, state.statusFilter);

            if (filteredTasks.length > 0) {
                allTasksHtml += `
                    <div class="mb-4">
                        <h3 class="text-base font-semibold text-slate-800 mb-3 px-3 py-1.5 bg-slate-50 rounded-lg inline-block">${deptName}</h3>
                        <div class="space-y-3">
                            ${filteredTasks.map(task => `
                                <div class="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft hover:shadow-lg transition-all duration-300 cursor-pointer card-hover"
                                     role="listitem" tabindex="0"
                                     onclick="toggleTaskDetails('all_${task.id}')"
                                     onkeydown="if(event.key==='Enter'||event.key===' ') toggleTaskDetails('all_${task.id}')">
                                    <div class="flex justify-between items-center px-4 py-3 bg-slate-50/50 border-b border-slate-100 group-hover:bg-slate-100 transition-colors">
                                        <span class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold text-sm">${task.id || 'N/A'}</span>
                                        <div class="flex items-center gap-3">
                                            <span class="px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusClass(task.status)}" aria-label="Статус: ${task.status || 'без статуса'}">${task.status || '-'}</span>
                                            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform duration-300 ${state.expandedTasks['all_' + task.id] ? 'rotate-180' : ''}" aria-hidden="true"></i>
                                        </div>
                                    </div>
                                    <div class="p-4 space-y-3 ${state.expandedTasks['all_' + task.id] ? 'block' : 'line-clamp-2'}">
                                        <div class="text-slate-900 font-medium leading-relaxed" aria-label="Описание задачи">${task.task || ''}</div>
                                        ${task.product ? `
                                            <div class="flex items-start gap-2 text-sm">
                                                <i data-lucide="package" class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" aria-hidden="true"></i>
                                                <span class="text-slate-600">${task.product}</span>
                                            </div>
                                        ` : ''}
                                        ${task.comment ? `
                                            <div class="flex items-start gap-2 text-sm">
                                                <i data-lucide="message-square" class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" aria-hidden="true"></i>
                                                <span class="text-slate-600">${task.comment}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
    }
    
    if (!allTasksHtml) {
        allTasksHtml = '<div class="p-8 text-center text-slate-400">Нет задач для отображения. Нажмите "Обновить" для загрузки.</div>';
    }
    
    return allTasksHtml;
};

const filterTasksByStatus = (tasks, filter) => {
    if (filter === 'all') return tasks;
    return tasks.filter(task => {
        const status = (task.status || '').toLowerCase();
        switch (filter) {
            case 'done': return status.includes('выполн');
            case 'in_progress': return status.includes('работе') || status.includes('progress');
            case 'not_done': return status.includes('не выполн');
            default: return true;
        }
    });
};

const getStatusFilterLabel = (filter) => {
    switch (filter) {
        case 'all': return 'Все';
        case 'done': return '✓ Выполнено';
        case 'in_progress': return '⟳ В работе';
        case 'not_done': return '✕ Не выполнено';
        default: return 'Фильтр';
    }
};

const renderDepartmentTasks = (department) => {
    const data = departmentsData[department];
    
    if (!data || !data.weeks || data.weeks.length === 0) {
        return '<div class="p-8 text-center text-slate-400">Нет данных. Нажмите "Обновить" для загрузки.</div>';
    }
    
    // Special renderers for complex formats
    if (department === 'РОПР') {
        return renderRoPRDepartment(data);
    }
    
    if (department === 'РСО') {
        return renderRSODepartment(data);
    }
    
    const filterLabel = getStatusFilterLabel(state.statusFilter);
    
    return `
        <div class="mb-4">
            <select id="statusFilterSelect" onchange="setStatusFilter(this.value)" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer shadow-soft">
                <option value="all" ${state.statusFilter === 'all' ? 'selected' : ''}>📋 Все</option>
                <option value="done" ${state.statusFilter === 'done' ? 'selected' : ''}>✓ Выполнено</option>
                <option value="in_progress" ${state.statusFilter === 'in_progress' ? 'selected' : ''}>⟳ В работе</option>
                <option value="not_done" ${state.statusFilter === 'not_done' ? 'selected' : ''}>✕ Не выполнено</option>
            </select>
        </div>
        ${data.weeks.map((week, weekIndex) => {
            const filteredTasks = filterTasksByStatus(week.tasks, state.statusFilter);
            if (filteredTasks.length === 0) return '';
            
            const weekCompleted = week.tasks.filter(t => (t.status || '').toLowerCase().includes('выполн')).length;
            const weekTotal = week.tasks.length;
            const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
        
        return `
            <div class="border-b border-slate-100 last:border-0 mb-4">
                <div class="bg-white px-4 py-3 flex flex-nowrap flex-row justify-between items-center gap-2 border-l-4 border-green-500 shadow-soft rounded-r-xl">
                    <span class="font-semibold text-slate-800">${week.name}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-slate-500">${weekCompleted}/${weekTotal}</span>
                        <span class="px-3 py-1 font-semibold text-white rounded-full ${weekPercent >= 70 ? 'bg-green-500' : weekPercent >= 40 ? 'bg-amber-500' : 'bg-red-500'}">${weekPercent}%</span>
                    </div>
                </div>

                <div class="space-y-3 p-3" role="list" aria-label="Список задач">
                    ${filteredTasks.map(task => `
                        <div class="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft hover:shadow-lg transition-all duration-300 cursor-pointer card-hover"
                             role="listitem" tabindex="0"
                             onclick="toggleTaskDetails('${task.id}')"
                             onkeydown="if(event.key==='Enter'||event.key===' ') toggleTaskDetails('${task.id}')">
                            <div class="flex justify-between items-center px-4 py-3 bg-slate-50/50 border-b border-slate-100 group-hover:bg-slate-100 transition-colors">
                                <span class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold text-sm">${task.id}</span>
                                <div class="flex items-center gap-3">
                                    <span class="px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusClass(task.status)}" aria-label="Статус: ${task.status || 'без статуса'}">${task.status || '-'}</span>
                                    <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform duration-300 ${state.expandedTasks[task.id] ? 'rotate-180' : ''}" aria-hidden="true"></i>
                                </div>
                            </div>
                            <div class="p-4 space-y-3 ${state.expandedTasks[task.id] ? 'block' : 'line-clamp-2'}">
                                <div class="text-slate-900 font-medium leading-relaxed" aria-label="Описание задачи">${task.task}</div>
                                ${task.product ? `
                                    <div class="flex items-start gap-2 text-sm">
                                        <i data-lucide="package" class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" aria-hidden="true"></i>
                                        <span class="text-slate-600">${task.product}</span>
                                    </div>
                                ` : ''}
                                ${task.comment ? `
                                    <div class="flex items-start gap-2 text-sm">
                                        <i data-lucide="message-square" class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" aria-hidden="true"></i>
                                        <span class="text-slate-600">${task.comment}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('')}
    ${data.weeks.every(week => filterTasksByStatus(week.tasks, state.statusFilter).length === 0) ? '<div class="p-8 text-center text-slate-400">Нет задач с выбранным статусом</div>' : ''}
    </div>
    `;
}

const renderRoPRDepartment = (data) => {
    if (!data || !data.weeks || data.weeks.length === 0) {
        return '<div class="p-8 text-center text-slate-400">Нет данных. Нажмите "Обновить" для загрузки.</div>';
    }
    
    return data.weeks.map(week => `
        <div class="border-b border-slate-200 last:border-0">
            <div class="bg-green-50 px-4 py-3 flex flex-nowrap flex-row justify-between items-center gap-2 border-l-4 border-green-600 shadow-sm">
                <span class="font-bold text-green-900 text-base">${week.period}</span>
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-green-700">${week.stats?.completed || 0}/${week.stats?.total || 0}</span>
                    <span class="px-3 py-1 font-bold text-white bg-green-600">${week.stats?.percent || '0%'}</span>
                </div>
            </div>
            
            <!-- Indicators -->
            ${week.indicators.length > 0 ? `
                <div class="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <div class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">ПОКАЗАТЕЛИ</div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        ${week.indicators.map(ind => `
                            <div class="bg-white border border-slate-200 p-2">
                                <div class="text-xs text-slate-500 truncate">${ind.name}</div>
                                <div class="text-sm font-bold text-slate-800">${ind.quantity || '-'}</div>
                                ${ind.comment ? `<div class="text-xs text-slate-400 mt-1">${ind.comment}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Past Week Tasks -->
            ${week.pastTasks.length > 0 ? `
                <div class="px-4 py-2 border-b border-slate-200 bg-slate-50">
                    <div class="text-xs font-bold text-slate-600 uppercase tracking-wider">ЗАДАЧИ ПРОШЕДШЕЙ НЕДЕЛИ</div>
                </div>
                <div class="space-y-2 p-3">
                    ${week.pastTasks.map(task => `
                        <div class="bg-white border border-slate-200 p-3">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-xs font-bold text-slate-700">#${task.id}</span>
                                <span class="px-2 py-0.5 rounded text-xs font-bold border ${getStatusClass(task.status)}">${task.status}</span>
                            </div>
                            <div class="text-sm text-slate-900 mb-1">${task.task}</div>
                            ${task.result ? `<div class="text-xs text-slate-500">Результат: ${task.result}</div>` : ''}
                            ${task.comment ? `<div class="text-xs text-slate-400 mt-1">${task.comment}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Current Week Tasks -->
            ${week.currentTasks.length > 0 ? `
                <div class="px-4 py-2 border-b border-slate-200 bg-slate-50">
                    <div class="text-xs font-bold text-slate-600 uppercase tracking-wider">ЗАДАЧИ НА ТЕКУЩУЮ НЕДЕЛЮ</div>
                </div>
                <div class="space-y-2 p-3">
                    ${week.currentTasks.map(task => `
                        <div class="bg-white border border-slate-200 p-3">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-xs font-bold text-slate-700">#${task.id}</span>
                                <span class="px-2 py-0.5 rounded text-xs font-bold border ${getStatusClass(task.status)}">${task.status}</span>
                            </div>
                            <div class="text-sm text-slate-900 mb-1">${task.task}</div>
                            ${task.result ? `<div class="text-xs text-slate-500">Результат: ${task.result}</div>` : ''}
                            ${task.comment ? `<div class="text-xs text-slate-400 mt-1">${task.comment}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
};

const renderRSODepartment = (data) => {
    if (!data || !data.weeks || data.weeks.length === 0) {
        return '<div class="p-8 text-center text-slate-400">Нет данных</div>';
    }
    
    return data.weeks.map(week => `
        <div class="border-b border-slate-200 last:border-0">
            <div class="bg-green-50 px-4 py-3 flex flex-nowrap flex-row justify-between items-center gap-2 border-l-4 border-green-600 shadow-sm">
                <span class="font-bold text-green-900 text-base">${week.period}</span>
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-green-700">${week.stats.completed}/${week.stats.total}</span>
                    <span class="px-3 py-1 font-bold text-white bg-green-600">${week.stats.percent || '0%'}</span>
                </div>
            </div>
            
            <div class="space-y-2 p-3">
                ${week.tasks.map(task => `
                    <div class="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <div class="flex justify-between items-center px-3 py-2 bg-slate-50 border-b border-slate-100">
                            <span class="font-bold text-slate-700">#${task.id}</span>
                            <span class="px-2 py-0.5 rounded text-xs font-bold border ${getStatusClass(task.status)}">${task.status}</span>
                        </div>
                        <div class="p-3 space-y-2">
                            <div class="text-slate-900 font-medium">${task.task}</div>
                            ${task.product ? `<div class="text-sm"><span class="text-slate-500">📦:</span><span class="text-slate-700 ml-1">${task.product}</span></div>` : ''}
                            ${task.comment ? `<div class="text-sm"><span class="text-slate-500">💬:</span><span class="text-slate-700 ml-1">${task.comment}</span></div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
};



window.switchDepartment = (dept) => {
    currentDepartment = dept;
    state.statusFilter = 'all';
    state.expandedTasks = {};

    document.querySelectorAll('.department-btn').forEach(btn => {
        if (btn && btn.dataset && btn.dataset.dept === dept) {
            btn.classList.add('border-green-500', 'bg-green-50');
            btn.classList.remove('border-slate-200');
        } else if (btn) {
            btn.classList.remove('border-green-500', 'bg-green-50');
            btn.classList.add('border-slate-200');
        }
    });

    const titleEl = document.getElementById('deptTitle');
    if (titleEl) titleEl.textContent = dept;

    const container = document.querySelector('.overflow-x-auto.custom-scrollbar');
    if (container) {
        container.innerHTML = renderDepartmentTasks(dept);
    }

    const filterSelect = document.getElementById('statusFilterSelect');
    if (filterSelect) filterSelect.value = 'all';

    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.toggleTaskDetails = (taskId) => {
    state.expandedTasks[taskId] = !state.expandedTasks[taskId];
    const container = document.querySelector('.overflow-x-auto.custom-scrollbar');
    if (container) {
        if (state.korsovetMode === 'plan_dnya') {
            container.innerHTML = `
                <div class="mb-4">
                    <select id="statusFilterSelect" onchange="setStatusFilter(this.value)" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer shadow-soft">
                        <option value="all" ${state.statusFilter === 'all' ? 'selected' : ''}>📋 Все</option>
                        <option value="done" ${state.statusFilter === 'done' ? 'selected' : ''}>✓ Выполнено</option>
                        <option value="in_progress" ${state.statusFilter === 'in_progress' ? 'selected' : ''}>⟳ В работе</option>
                        <option value="not_done" ${state.statusFilter === 'not_done' ? 'selected' : ''}>✕ Не выполнено</option>
                    </select>
                </div>
                ${renderAllDepartmentsTasks()}
            `;
        } else {
            container.innerHTML = renderDepartmentTasks(currentDepartment);
        }
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.setStatusFilter = (filter) => {
    state.statusFilter = filter;
    const container = document.querySelector('.overflow-x-auto.custom-scrollbar');
    if (container) {
        if (state.korsovetMode === 'plan_dnya') {
            container.innerHTML = `
                <div class="mb-4">
                    <select id="statusFilterSelect" onchange="setStatusFilter(this.value)" class="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-sm font-bold bg-white focus:outline-none focus:border-green-500 cursor-pointer">
                        <option value="all" ${state.statusFilter === 'all' ? 'selected' : ''}>📋 Все</option>
                        <option value="done" ${state.statusFilter === 'done' ? 'selected' : ''}>✓ Выполнено</option>
                        <option value="in_progress" ${state.statusFilter === 'in_progress' ? 'selected' : ''}>⟳ В работе</option>
                        <option value="not_done" ${state.statusFilter === 'not_done' ? 'selected' : ''}>✕ Не выполнено</option>
                    </select>
                </div>
                ${renderAllDepartmentsTasks()}
            `;
        } else {
            container.innerHTML = renderDepartmentTasks(currentDepartment);
        }
    }
    const filterSelect = document.getElementById('statusFilterSelect');
    if (filterSelect) filterSelect.value = filter;
};
window.setDirectorFilter = (type) => {
    state.reportType = type;
    render();
};
window.setDashboardFilter = (type) => {
    state.reportType = type;
    render();
};





// --- RENDER FUNCTIONS ---
const render = () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    const app = document.getElementById('app');
    
    // Проверяем, существует ли элемент app перед тем, как изменять его содержимое
    if (!app) {
        console.error('Элемент с ID "app" не найден в DOM');
        return;
    }
    
    let content = '';

    content += `<div id="banner"></div>`;

    content += `
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex justify-around py-1 md:hidden safe-area-pb shadow-soft-lg">
        <button onclick="navigate('sheets')" class="flex flex-col items-center justify-center p-3 w-full font-medium text-xs ${state.view === 'sheets' ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'} touch-manipulation transition-colors">
            <i data-lucide="table" class="mb-1 w-5 h-5"></i>
            Отчеты
        </button>
        <button onclick="navigate('create')" class="flex flex-col items-center justify-center p-3 w-full font-medium text-xs ${state.view === 'create' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'} touch-manipulation transition-colors">
            <i data-lucide="file-edit" class="mb-1 w-5 h-5"></i>
            Заполнить
        </button>
        <button onclick="selectDirectorView()" class="flex flex-col items-center justify-center p-3 w-full font-medium text-xs ${state.view === 'director' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'} touch-manipulation transition-colors">
            <i data-lucide="eye" class="mb-1 w-5 h-5"></i>
            Директор
        </button>
    </div>`;

    content += `<div class="max-w-4xl mx-auto p-2 sm:p-4 md:p-8 space-y-4 sm:space-y-6 pb-20 sm:pb-8">`;

    if (state.view === 'director') {
        content = renderDirectorView();
    } else {
        content = renderGoogleSheetsDashboard();
    }

    content += `</div>`;

    app.innerHTML = content;
    if (typeof lucide !== 'undefined') lucide.createIcons();
};



const renderKpiRow = (key, title, icon, color) => {
    return `
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start sm:items-center p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors rounded-xl">
        <div class="sm:col-span-4 flex items-center gap-3 font-medium text-slate-700">
            <div class="p-2 bg-slate-50 border border-slate-100 rounded-lg"><i data-lucide="${icon}" class="w-4 h-4 sm:w-5 sm:h-5 text-slate-500"></i></div>
            <span class="text-sm uppercase tracking-tight truncate">${title}</span>
        </div>
        <div class="sm:col-span-3 w-full">
            <input type="number" value="${state.kpis[key].quantity}" oninput="updateKpi('${key}', 'quantity', this.value)" ${state.isLocked ? 'disabled' : ''} class="w-full px-3 py-2.5 bg-white text-slate-900 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-mono text-center h-10 sm:h-11 touch-manipulation shadow-soft" placeholder="0">
        </div>
        <div class="sm:col-span-5 w-full">
            <textarea rows="1" oninput="updateKpi('${key}', 'description', this.value)" ${state.isLocked ? 'disabled' : ''} class="w-full px-3 py-2 bg-white text-slate-900 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none overflow-hidden min-h-10 sm:min-h-11 leading-normal touch-manipulation shadow-soft" placeholder="Описание">${state.kpis[key].description}</textarea>
        </div>
    </div>`;
};

const renderKdIndicatorRow = (key, title, icon, color) => {
    return `
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start sm:items-center p-3 sm:p-4 hover:bg-slate-50">
        <div class="sm:col-span-4 flex items-center gap-2 sm:gap-3 font-bold text-slate-700 mb-2 sm:mb-0">
            <div class="p-1.5 sm:p-2 shrink-0 border bg-${color}-100 text-${color}-700 border-${color}-200"><i data-lucide="${icon}" class="w-4 h-4 sm:w-5 sm:h-5"></i></div>
            <span class="text-sm sm:text-base uppercase tracking-tight truncate">${title}</span>
        </div>
        <div class="sm:col-span-3 w-full">
            <input type="number" value="${state.kdIndicators[key]?.quantity || 0}" oninput="updateKdIndicator('${key}', 'quantity', this.value)" ${state.isLocked ? 'disabled' : ''} class="w-full px-2 sm:px-3 py-2.5 sm:py-2 bg-white text-slate-900 text-sm sm:text-base border-2 border-slate-300 focus:outline-none focus:border-blue-600 font-mono text-center h-10 sm:h-[42px] touch-manipulation" placeholder="0">
        </div>
        <div class="sm:col-span-5 w-full">
            <textarea rows="1" oninput="updateKdIndicator('${key}', 'description', this.value)" ${state.isLocked ? 'disabled' : ''} class="w-full px-2 sm:px-3 py-2 bg-white text-slate-900 text-sm sm:text-base border-2 border-slate-300 focus:outline-none focus:border-blue-600 resize-none overflow-hidden min-h-10 sm:min-h-[42px] leading-normal touch-manipulation" placeholder="Описание">${state.kdIndicators[key]?.description || ''}</textarea>
        </div>
    </div>`;
};

const renderKdDoubleIndicatorRow = (key, title, icon, color) => {
    return `
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start sm:items-center p-3 sm:p-4 hover:bg-slate-50">
        <div class="sm:col-span-4 flex items-center gap-2 sm:gap-3 font-bold text-slate-700 mb-2 sm:mb-0">
            <div class="p-1.5 sm:p-2 shrink-0 border bg-${color}-100 text-${color}-700 border-${color}-200"><i data-lucide="${icon}" class="w-4 h-4 sm:w-5 sm:h-5"></i></div>
            <span class="text-sm sm:text-base uppercase tracking-tight truncate">${title}</span>
        </div>
        <div class="sm:col-span-3 w-full grid grid-cols-2 gap-2">
            <input type="number" value="${state.kdIndicators[key]?.quantity || 0}" oninput="updateKdIndicator('${key}', 'quantity', this.value)" ${state.isLocked ? 'disabled' : ''} class="px-2 py-2 bg-white text-slate-900 text-sm border-2 border-slate-300 focus:outline-none focus:border-blue-600 font-mono text-center h-10 touch-manipulation" placeholder="шт">
            <input type="number" value="${state.kdIndicators[key]?.amount || 0}" oninput="updateKdIndicator('${key}', 'amount', this.value)" ${state.isLocked ? 'disabled' : ''} class="px-2 py-2 bg-white text-slate-900 text-sm border-2 border-slate-300 focus:outline-none focus:border-blue-600 font-mono text-center h-10 touch-manipulation" placeholder="руб">
        </div>
        <div class="sm:col-span-5 w-full">
            <textarea rows="1" oninput="updateKdIndicator('${key}', 'description', this.value)" ${state.isLocked ? 'disabled' : ''} class="w-full px-2 sm:px-3 py-2 bg-white text-slate-900 text-sm sm:text-base border-2 border-slate-300 focus:outline-none focus:border-blue-600 resize-none overflow-hidden min-h-10 sm:min-h-[42px] leading-normal touch-manipulation" placeholder="Описание">${state.kdIndicators[key]?.description || ''}</textarea>
        </div>
    </div>`;
};

const renderTaskRow = (task, index) => {
    const status = STATUS_OPTIONS.find(s => s.value === task.status) || STATUS_OPTIONS[3];
    return `
    <div class="border border-slate-100 p-4 relative group bg-white hover:border-slate-200 touch-manipulation rounded-xl shadow-soft">
        <div class="flex justify-end items-center mb-2 sm:hidden">
            <button onclick="removeTask('${task.id}')" class="p-2 text-slate-400 hover:text-red-500 touch-manipulation"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div class="sm:col-span-5">
                <label class="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Задача</label>
                <textarea rows="1" oninput="updateTask('${task.id}', 'task_text', this.value)" class="w-full px-3 py-2.5 bg-slate-50 text-slate-900 text-sm border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none overflow-hidden min-h-10" placeholder="Суть задачи">${task.task_text}</textarea>
            </div>
            <div class="sm:col-span-4">
                <label class="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Результат</label>
                <textarea rows="1" oninput="updateTask('${task.id}', 'product', this.value)" class="w-full px-3 py-2.5 bg-slate-50 text-slate-900 text-sm border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none overflow-hidden min-h-10" placeholder="Ожидаемый итог">${task.product}</textarea>
            </div>
            <div class="sm:col-span-3">
                <label class="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Статус</label>
                <div class="relative">
                    <select onchange="updateTask('${task.id}', 'status', this.value)" class="w-full px-3 py-2.5 h-10 appearance-none text-sm font-medium rounded-lg border border-slate-200 focus:outline-none ${status.color} touch-manipulation bg-white">
                        ${STATUS_OPTIONS.map(opt => `<option value="${opt.value}" class="bg-white text-slate-900" ${task.status === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                    <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>
            </div>
            <div class="hidden sm:flex sm:col-span-12 items-center justify-between gap-3 pt-2 border-t border-slate-100 mt-2">
                <label class="flex items-center gap-2 text-[10px] font-medium text-amber-600 uppercase tracking-wider">
                    <input type="checkbox" onchange="toggleTaskFocus('${task.id}')" ${task.focus ? 'checked' : ''} class="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 touch-manipulation">
                    В фокусе
                </label>
                <button onclick="removeTask('${task.id}')" class="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 h-10 flex items-center justify-center touch-manipulation rounded-lg transition-colors"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </div>
        <div class="mt-3 pt-2 border-t border-slate-100">
             <div class="flex items-center gap-2">
                 <label class="text-[10px] font-medium text-slate-400 uppercase tracking-wider shrink-0">Комментарий:</label>
                 <textarea rows="1" oninput="updateTask('${task.id}', 'comment', this.value)" class="w-full px-2 py-1.5 text-sm text-slate-600 italic bg-transparent border-b border-slate-200 hover:border-slate-300 focus:border-green-500 focus:outline-none resize-none overflow-hidden min-h-[30px]" placeholder="Примечания...">${task.comment}</textarea>
             </div>
        </div>
    </div>`;
};

const renderUnplannedRow = (task) => {
    const status = STATUS_OPTIONS.find(s => s.value === task.status) || STATUS_OPTIONS[3];
    return `
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-white p-4 border border-amber-100 shadow-sm rounded-xl">
        <div class="sm:col-span-5 w-full">
           <label class="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block sm:hidden">Задача</label>
           <textarea rows="1" oninput="updateUnplanned('${task.id}', 'task_text', this.value)" class="w-full px-3 py-2.5 bg-white text-slate-900 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 resize-none overflow-hidden min-h-10" placeholder="Что прилетело?">${task.task_text}</textarea>
        </div>
        <div class="sm:col-span-4 w-full">
          <label class="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block sm:hidden">Результат</label>
          <textarea rows="1" oninput="updateUnplanned('${task.id}', 'product', this.value)" class="w-full px-3 py-2.5 bg-white text-slate-900 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 resize-none overflow-hidden min-h-10" placeholder="Результат">${task.product}</textarea>
        </div>
        <div class="sm:col-span-3 flex flex-col gap-2">
          <label class="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0 sm:hidden">Статус</label>
          <div class="relative flex gap-2">
              <select onchange="updateUnplanned('${task.id}', 'status', this.value)" class="flex-1 appearance-none text-sm border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium h-10 rounded-lg ${status.color} touch-manipulation bg-white">
                ${STATUS_OPTIONS.filter(o => o.value !== 'Без статуса').map(opt => `<option value="${opt.value}" class="bg-white text-slate-900" ${task.status === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
              <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              <button onclick="removeUnplanned('${task.id}')" class="px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 h-10 flex items-center justify-center touch-manipulation rounded-lg transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>
          <label class="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 uppercase tracking-wider">
              <input type="checkbox" onchange="toggleUnplannedFocus('${task.id}')" ${task.focus ? 'checked' : ''} class="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 touch-manipulation">
              В фокусе
          </label>
        </div>
    </div>`;
};

const renderReportItemCompact = (report) => {
    const percent = report.calculated_stats?.percent || 0;
    const percentClass = percent >= 80 ? 'text-green-600' : (percent >= 50 ? 'text-amber-600' : 'text-red-600');
    const percentBg = percent >= 80 ? 'bg-green-400' : (percent >= 50 ? 'bg-amber-400' : 'bg-red-400');
    const domId = 'rep-' + report.id;
    const typeLabel = report.report_type === 'monthly' ? 'МЕС' : 'НЕД';
    
    return `
    <div class="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-200 card-hover">
        <div onclick="var el=document.getElementById('${domId}'); if(el) el.classList.toggle('hidden'); if(typeof lucide!=='undefined')lucide.createIcons();" class="p-4 cursor-pointer">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <i data-lucide="file-text" class="w-4 h-4 text-slate-500"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5 mb-0.5">
                            <span class="text-xs font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 truncate max-w-[70px]">${report.department}</span>
                            <span class="text-[10px] px-2 py-0.5 ${report.report_type === 'monthly' ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-white'} rounded font-medium">${typeLabel}</span>
                        </div>
                        <div class="text-xs text-slate-400">${report.period?.week_dates || '—'}</div>
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <div class="text-right">
                        <div class="text-xl font-semibold ${percentClass}">${percent}%</div>
                        <div class="text-[9px] text-slate-400">${report.calculated_stats?.done || 0}/${report.calculated_stats?.total || 0}</div>
                    </div>
                </div>
            </div>
            <div class="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full ${percentBg} transition-all" style="width: ${percent}%"></div>
            </div>
        </div>
        <div id="${domId}" class="hidden border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
            ${report.tasks && report.tasks.length > 0 ? `
            <div>
                <div class="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <i data-lucide="list-todo" class="w-3 h-3"></i> Задачи (${report.tasks.length})
                </div>
                <div class="space-y-1">
                    ${report.tasks.slice(0, 5).map((t, i) => `
                    <div class="flex items-start gap-2 text-xs">
                        <span class="text-slate-400 font-mono min-w-[16px]">${i+1}.</span>
                        <div class="flex-1 min-w-0">
                            <div class="text-slate-700 truncate">${t.task_text || '—'}</div>
                            ${t.product ? `<div class="text-slate-400 text-[10px] truncate">→ ${t.product}</div>` : ''}
                        </div>
                        <span class="text-[9px] px-1.5 py-0.5 rounded border ${t.status === 'Выполнено' ? 'bg-green-50 text-green-600 border-green-100' : (t.status === 'Не выполнено' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100')}">${t.status}</span>
                    </div>
                    `).join('')}
                    ${report.tasks.length > 5 ? `<div class="text-xs text-slate-400 text-center py-1">...ещё ${report.tasks.length - 5}</div>` : ''}
                </div>
            </div>
            ` : ''}
            
            ${report.unplanned_tasks && report.unplanned_tasks.length > 0 ? `
            <div>
                <div class="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <i data-lucide="alert-triangle" class="w-3 h-3"></i> Вне плана (${report.unplanned_tasks.length})
                </div>
                <div class="space-y-1">
                    ${report.unplanned_tasks.slice(0, 3).map((t, i) => `
                    <div class="flex items-start gap-2 text-xs">
                        <span class="text-amber-400 font-mono min-w-[16px]">${i+1}.</span>
                        <div class="flex-1 min-w-0">
                            <div class="text-slate-700 truncate">${t.task_text || '—'}</div>
                            ${t.product ? `<div class="text-slate-400 text-[10px] truncate">→ ${t.product}</div>` : ''}
                        </div>
                        <span class="text-[9px] px-1.5 py-0.5 rounded border ${t.status === 'Выполнено' ? 'bg-green-50 text-green-600 border-green-100' : (t.status === 'Не выполнено' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100')}">${t.status}</span>
                    </div>
                    `).join('')}
                    ${report.unplanned_tasks.length > 3 ? `<div class="text-xs text-slate-400 text-center py-1">...ещё ${report.unplanned_tasks.length - 3}</div>` : ''}
                </div>
            </div>
            ` : ''}
            
            <button onclick="editReport('${report.id}')" class="w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1 transition-colors">
                <i data-lucide="pencil" class="w-3 h-3"></i> Редактировать
            </button>
        </div>
    </div>`;
};

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
                <h1 class="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight">Режим директора</h1>
                <p class="text-xs text-slate-500 mt-0.5">Обзор всех отчётов</p>
            </div>
            <button onclick="navigate('select-dept')" class="text-xs font-bold uppercase text-slate-500 hover:text-slate-800 tracking-wide flex items-center gap-1">
                <i data-lucide="arrow-left" class="w-3 h-3"></i> Назад
            </button>
        </div>

        <div class="flex justify-center mb-4">
            <div class="flex bg-white border border-slate-900 p-0.5">
                <button onclick="setDirectorFilter('weekly')" class="px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${state.reportType === 'weekly' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}">Неделя</button>
                <button onclick="setDirectorFilter('monthly')" class="px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${state.reportType === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}">Месяц</button>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-2 mb-4">
            <div class="bg-white border border-slate-200 p-3 text-center shadow-sm rounded-lg">
                <div class="text-2xl font-bold text-slate-900">${reports.length}</div>
                <div class="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">Отчётов</div>
            </div>
            <div class="bg-white border border-slate-200 p-3 text-center shadow-sm rounded-lg">
                <div class="text-2xl font-bold ${avgPercent >= 70 ? 'text-green-600' : (avgPercent >= 40 ? 'text-amber-600' : 'text-red-600')}">${avgPercent}%</div>
                <div class="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">Средний %</div>
            </div>
            <div class="${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border p-3 text-center shadow-sm rounded-lg">
                <div class="text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-green-600'}">${overdueCount}</div>
                <div class="text-[10px] uppercase tracking-wide ${overdueCount > 0 ? 'text-red-600' : 'text-green-600'} mt-0.5">В фокусе</div>
            </div>
        </div>

        <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <i data-lucide="alert-circle" class="w-4 h-4 text-red-500"></i>
                    Требуют внимания
                </h3>
                ${outstandingTasks.length > 0 ? `<span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">${outstandingTasks.length}</span>` : ''}
            </div>
            ${outstandingTasks.length === 0 ? 
            `<div class="text-center py-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase rounded flex items-center justify-center gap-1">
                <i data-lucide="check-circle" class="w-4 h-4"></i> Всё в порядке
            </div>` :
            `<div class="space-y-2">${outstandingTasks.map(task => renderOutstandingTaskCompact(task)).join('')}</div>`}
        </div>

        <div>
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <i data-lucide="folder" class="w-4 h-4 text-blue-500"></i>
                    Все отчёты
                </h3>
                <span class="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">${reports.length}</span>
            </div>
            ${reports.length === 0 ? 
            `<div class="text-center py-6 bg-slate-50 border border-slate-200 text-slate-400 text-xs font-bold uppercase rounded flex items-center justify-center gap-1">
                <i data-lucide="inbox" class="w-4 h-4"></i> Отчётов пока нет
            </div>` : 
            `<div class="space-y-2">${reports.map(report => renderReportItemCompact(report)).join('')}</div>`}
        </div>
    </div>`;

    return content;
};

const renderOutstandingTaskCompact = (task) => {
    const statusColors = {
        'Выполнено': 'bg-green-100 text-green-700 border-green-200',
        'Не выполнено': 'bg-red-100 text-red-700 border-red-200',
        'В работе': 'bg-blue-100 text-blue-700 border-blue-200',
        'Без статуса': 'bg-slate-100 text-slate-600 border-slate-200'
    };
    const colorClass = statusColors[task.status] || statusColors['Без статуса'];
    
    return `
    <div class="bg-white border-l-4 border-red-400 p-2.5 shadow-sm hover:shadow-md transition-shadow rounded-r">
        <div class="flex justify-between items-start gap-2">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-1">
                    <span class="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">${task.department}</span>
                    <span class="text-[10px] text-slate-400">${task.period}</span>
                </div>
                <div class="text-sm font-medium text-slate-900 leading-tight mb-1">${task.task_text}</div>
                ${task.product ? `<div class="text-xs text-slate-500 truncate">→ ${task.product}</div>` : ''}
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${colorClass} shrink-0 whitespace-nowrap">${task.status}</span>
        </div>
    </div>`;
};

const getOutstandingTasks = () => {
    const outstandingTasks = [];
    const reports = state.history;
    
    reports.forEach(report => {
        if (report.tasks && Array.isArray(report.tasks)) {
            report.tasks.forEach(task => {
                if (task.status !== 'Выполнено' && task.focus) {
                    outstandingTasks.push({ ...task, department: report.department, period: report.period?.week_dates, reportId: report.id });
                }
            });
        }
        if (report.unplanned_tasks && Array.isArray(report.unplanned_tasks)) {
            report.unplanned_tasks.forEach(task => {
                if (task.status !== 'Выполнено' && task.focus) {
                    outstandingTasks.push({ ...task, department: report.department, period: report.period?.week_dates, reportId: report.id });
                }
            });
        }
    });
    
    return outstandingTasks;
};

const renderDashboard = () => {
    const reports = state.history.filter(r => r.report_type === state.reportType && r.department === state.department);
    let total = 0, done = 0;
    reports.forEach(r => { total += r.calculated_stats?.total || 0; done += r.calculated_stats?.done || 0; });
    const percent = total > 0 ? Math.round((done/total)*100) : 0;
    const percentClass = percent >= 80 ? 'text-green-500' : (percent >= 50 ? 'text-amber-500' : 'text-red-500');

    return `
    <div class="animate-fade-in pb-24">
        <div class="flex justify-center mb-4">
            <div class="flex bg-white border border-slate-900 p-0.5">
                <button onclick="setDashboardFilter('weekly')" class="px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${state.reportType === 'weekly' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}">Нед</button>
                <button onclick="setDashboardFilter('monthly')" class="px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${state.reportType === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}">Мес</button>
            </div>
        </div>

        <div class="bg-slate-800 text-white p-4 border-b-4 border-indigo-500 mb-4">
             <div class="flex items-end justify-between">
                 <div>
                    <div class="text-xs text-indigo-300 font-bold uppercase tracking-wide mb-1">Эффективность</div>
                    <div class="text-xs text-indigo-200">${state.reportType === 'weekly' ? 'Текущая неделя' : 'Текущий месяц'}</div>
                 </div>
                 <div class="text-right">
                     <div class="text-4xl font-extrabold tracking-tight ${percentClass}">${percent}%</div>
                 </div>
             </div>
             <div class="flex items-center justify-between mt-3 text-xs">
                 <div class="text-indigo-300"><span class="font-bold text-white">${done}</span> / ${total}</div>
                 <div class="w-24 h-2 bg-slate-600 rounded-full overflow-hidden">
                     <div class="h-full bg-emerald-400 transition-all" style="width: ${percent}%"></div>
                 </div>
             </div>
        </div>

        <div class="grid grid-cols-2 gap-2 mb-4">
            <div class="bg-white border border-slate-200 p-3 text-center shadow-sm">
                <div class="text-2xl font-bold text-slate-900">${reports.length}</div>
                <div class="text-[10px] uppercase tracking-wide text-slate-500">Отчетов</div>
            </div>
            <div class="bg-white border border-slate-200 p-3 text-center shadow-sm">
                <div class="text-2xl font-bold text-slate-900">${total}</div>
                <div class="text-[10px] uppercase tracking-wide text-slate-500">Всего задач</div>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">История</h3>
            ${reports.length === 0 ? 
            `<div class="text-center py-4 bg-slate-50 border border-slate-200 text-slate-400 text-xs font-bold uppercase">Нет отчетов</div>` : 
            `<div class="space-y-2">${reports.map(report => renderReportItemCompact(report)).join('')}</div>`}
        </div>
    </div>`;
};

const renderGoogleSheetsView = () => {
    const defaultSpreadsheetId = '1r5ketMWQAkiXGQMEq9jR_qf0CQLZhFaZDfGrUTAtyvU';
    const defaultSheetNames = ['НП', 'ГИ', 'КД', 'РОМ', 'РОПР', 'РСО'];
    
    return `
    <div class="animate-fade-in pb-24">
        <div class="flex flex-col items-center mb-4 pb-3 border-b-2 border-slate-300">
            <h1 class="text-xl md:text-2xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <i data-lucide="table" class="w-6 h-6 text-green-600"></i>
                Отчеты
            </h1>
            <p class="text-xs text-slate-500 mt-2">${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <button onclick="refreshAllDepartments()" class="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold uppercase rounded flex items-center gap-2 shadow-md transition-all hover:shadow-lg">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                Обновить
            </button>
        </div>

        <div id="sheetsConfigPanel" class="bg-white border-2 border-slate-200 rounded-lg overflow-hidden mb-4">
            <div class="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h2 class="font-bold text-slate-800 flex items-center gap-2">
                    <i data-lucide="link" class="w-4 h-4 text-blue-500"></i>
                    Подключение к Google Таблице
                </h2>
            </div>
            <div class="p-4 space-y-4">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Ссылка на таблицу</label>
                    <input type="text" id="sheetsUrl" value="https://docs.google.com/spreadsheets/d/${defaultSpreadsheetId}/edit"
                        class="w-full px-3 py-2 border-2 border-slate-300 rounded focus:outline-none focus:border-green-500 text-sm">
                </div>
                <div class="flex gap-2">
                    <button onclick="connectGoogleSheets()" class="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-wider text-sm rounded flex items-center justify-center gap-2">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        Подключить
                    </button>
                    <button onclick="loadAllDepartments()" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-sm rounded flex items-center justify-center gap-2">
                        <i data-lucide="database" class="w-4 h-4"></i>
                        Загрузить все отделы
                    </button>
                </div>
            </div>
        </div>

        <div id="sheetsStatus" class="hidden mb-4">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                    <i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i>
                    <span class="font-bold text-green-700">Подключено</span>
                </div>
                <p class="text-sm text-green-600" id="connectedInfo">Данные загружены</p>
            </div>
        </div>

        <div id="departmentsTabs" class="mb-4">
            <div class="border-b border-slate-200">
                <nav class="-mb-px flex space-x-1" id="tabNav">
                    ${defaultSheetNames.map((sheet, index) => `
                        <button onclick="selectDepartmentTab('${sheet}')" 
                            class="px-4 py-2 text-sm font-medium rounded-t-lg ${index === 0 ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
                            data-tab="${sheet}">
                            ${sheet}
                        </button>
                    `).join('')}
                </nav>
            </div>
        </div>

        <div id="departmentData" class="space-y-4">
            <div class="bg-white border-2 border-slate-200 rounded-lg overflow-hidden">
                <div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h2 class="font-bold text-slate-800 flex items-center gap-2">
                        <i data-lucide="database" class="w-4 h-4 text-green-600"></i>
                        <span id="currentDepartmentTitle">НП</span>
                    </h2>
                    <div class="flex gap-2">
                        <button onclick="importDepartment()" class="hidden text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1">
                            <i data-lucide="download" class="w-3 h-3"></i>
                            Импортировать
                        </button>
                        <button onclick="refreshDepartment()" class="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1">
                            <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                            Обновить
                        </button>
                    </div>
                </div>
                <div class="p-4">
                    <div class="overflow-x-auto custom-scrollbar">
                        <table class="w-full text-sm">
                            <thead class="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th class="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">№</th>
                                    <th class="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Задача</th>
                                    <th class="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Продукт</th>
                                    <th class="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Результат</th>
                                    <th class="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Статус</th>
                                </tr>
                            </thead>
                            <tbody id="departmentTableBody" class="divide-y divide-slate-100">
                                <tr><td colspan="5" class="px-3 py-8 text-center text-slate-400">Загрузка данных...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
};

let currentDepartment = 'НП';
let departmentsData = {};
let currentSpreadsheetId = '1r5ketMWQAkiXGQMEq9jR_qf0CQLZhFaZDfGrUTAtyvU';

window.connectGoogleSheets = async () => {
    const url = document.getElementById('sheetsUrl').value;
    
    if (!url) {
        alert('Введите ссылку на таблицу');
        return;
    }
    
    try {
        const response = await fetch('/api/sheets/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, sheetName: 'НП' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentSpreadsheetId = data.spreadsheetId;
            const sheetsStatusEl = document.getElementById('sheetsStatus');
            if (sheetsStatusEl) sheetsStatusEl.classList.remove('hidden');
            const connectedInfoEl = document.getElementById('connectedInfo');
            if (connectedInfoEl) connectedInfoEl.textContent = data.title || 'Таблица подключена';
            await loadAllDepartments();
        } else {
            alert('Ошибка: ' + data.error);
        }
    } catch (e) {
        alert('Ошибка: ' + e.message);
    }
};

window.loadAllDepartments = async () => {
    const gridElement = document.getElementById('departmentGrid');
    if (gridElement) {
        gridElement.innerHTML = `
            <div class="flex items-center justify-center p-8 col-span-full" role="status" aria-live="polite">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mr-4"></div>
                <span class="text-lg font-bold text-slate-700">Загрузка данных отделов...</span>
            </div>`;
    }
    
    try {
        const sheetNames = ['НП', 'ГИ', 'КД', 'РОП', 'РОМ', 'РОПР', 'РСО'];

        const response = await fetch('/api/sheets/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                spreadsheetId: currentSpreadsheetId,
                sheetNames: sheetNames
            })
        });

        const data = await response.json();

        if (data.success) {
            departmentsData = {};
            data.results.forEach(result => {
                if (result.success) {
                    departmentsData[result.sheetName] = parseDepartmentData(result.data, result.sheetName);
                }
            });

            render();
            const sheetsStatusEl = document.getElementById('sheetsStatus');
            if (sheetsStatusEl) sheetsStatusEl.classList.remove('hidden');
            const connectedInfoEl = document.getElementById('connectedInfo');
            if (connectedInfoEl) connectedInfoEl.textContent = `Загружено ${Object.keys(departmentsData).length} отделов`;
        } else {
            // Показать сообщение об ошибке
            if (gridElement) {
                gridElement.innerHTML = `
                    <div class="col-span-full text-center py-8">
                        <div class="text-red-600 font-bold text-lg mb-2">Ошибка загрузки данных</div>
                        <p class="text-slate-600">Произошла ошибка при загрузке данных отделов. Пожалуйста, попробуйте еще раз.</p>
                        <button onclick="loadAllDepartments()" class="mt-4 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300">Повторить попытку</button>
                    </div>`;
            }
            console.error('Ошибка загрузки:', data.error);
        }
    } catch (e) {
        // Показать сообщение об ошибке
        if (gridElement) {
            gridElement.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-red-600 font-bold text-lg mb-2">Ошибка подключения</div>
                    <p class="text-slate-600">Не удалось подключиться к серверу. Проверьте подключение к интернету и попробуйте еще раз.</p>
                    <button onclick="loadAllDepartments()" class="mt-4 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300">Повторить попытку</button>
                </div>`;
        }
        console.error('Ошибка:', e.message);
    }
};

window.selectDepartmentTab = (sheetName) => {
    currentDepartment = sheetName;
    
    // Update tab styles
    document.querySelectorAll('#tabNav button').forEach(btn => {
        if (btn.dataset.tab === sheetName) {
            btn.className = 'px-4 py-2 text-sm font-medium rounded-t-lg bg-green-600 text-white';
        } else {
            btn.className = 'px-4 py-2 text-sm font-medium rounded-t-lg bg-slate-100 text-slate-600 hover:bg-slate-200';
        }
    });
    
    // Update title
    document.getElementById('currentDepartmentTitle').textContent = sheetName;
    
    // Render data
    render();
};

window.refreshDepartment = async () => {
    try {
        const response = await fetch('/api/sheets/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                url: `https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit`,
                sheetName: currentDepartment 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            departmentsData[currentDepartment] = parseDepartmentData(data.rows);
            render();
        } else {
            alert('Ошибка обновления: ' + data.error);
        }
    } catch (e) {
        alert('Ошибка: ' + e.message);
    }
};

window.refreshAllDepartments = async () => {
    await loadAllDepartments();
};

window.importDepartment = async () => {
    if (!confirm(`Импортировать данные отдела "${currentDepartment}" в систему?`)) return;
    
    try {
        const response = await fetch('/api/sheets/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                url: `https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit`,
                sheetName: currentDepartment 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Успешно импортировано ${data.imported} отчетов!`);
            await api.fetchReports();
            render();
        } else {
            alert('Ошибка импорта: ' + data.error);
        }
    } catch (e) {
        alert('Ошибка: ' + e.message);
    }
};

const parseDepartmentData = (rows, sheetName) => {
    if (!rows || rows.length === 0) return { weeks: [], stats: { total: 0, completed: 0, inProgress: 0, notCompleted: 0 } };

    // Проверяем, является ли это данными из таблицы "План дня руководителя"
    // В этой таблице структура может отличаться, поэтому добавим специальную обработку
    // Проверяем по характерным признакам структуры данных из таблицы "План дня"
    if (rows.length > 0 && (
        (rows[0] && rows[0].some(cell => cell && typeof cell === 'string' && cell.includes('План дня'))) || 
        (rows.length > 2 && rows[2] && rows[2].some(cell => cell && typeof cell === 'string' && cell.includes('План дня'))) ||
        (rows.length > 0 && rows[0] && rows[0].some(cell => cell && typeof cell === 'string' && cell.includes('тДЦ'))) || // проверяем наличие символа галочки в структуре
        (rows.length > 0 && rows[0] && rows[0][0] === '0' && rows[0].length >= 6) // проверяем характерную структуру данных "План дня" (начинается с "0","","","дата","","день недели")
    )) {
        return parseDirectorPlanData(rows, sheetName);
    }

    const weeks = [];
    let stats = { total: 0, completed: 0, inProgress: 0, notCompleted: 0 };

    const weekRegex = /\d{2}\.\d{2}-\d{2}\.\d{2}/;
    const weekRegex2 = /\d{2}\.\d{2}\.\d{2} - \d{2}\.\d{2}\.\d{2}/;

    const configs = {
        'НП': { dateCol: 2, format: 'np', taskCol: 2 },
        'ГИ': { dateCol: 1, format: 'gi', taskCol: 1 },
        'КД': { dateCol: 2, format: 'kd', taskCol: 2 },
        'РОП': { dateCol: 2, format: 'rop', taskCol: 1 },
        'РОМ': { dateCol: -1, format: 'rom', taskCol: -1 },
        'РОПР': { dateCol: 5, format: 'ropr', taskCol: 1 },
        'РСО': { dateCol: 2, format: 'rso', taskCol: 1 }
    };

    const config = configs[sheetName] || { dateCol: 2, format: 'standard', taskCol: 2 };

    // For РОМ - different format
    if (config.format === 'rom') {
        return { weeks: [{ name: 'Показатели', tasks: rows.slice(0, 10).map((r, i) => ({ id: i+1, task: r.join(' | ').substring(0, 100), product: '', status: 'Без статуса', comment: '' })) }], stats: { total: 10, completed: 0, inProgress: 0, notCompleted: 10 } };
    }

    // For РОПР - special complex format with indicators, past tasks, current tasks
    if (config.format === 'ropr') {
        return parseRoPRData(rows);
    }
    
    // For РСО - format with week type and 4 columns
    if (config.format === 'rso') {
        return parseRSOData(rows);
    }

    // Get current month for filtering
    const currentMonth = new Date().getMonth() + 1;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;

    // Helper function to get end month from week date (for transition weeks)
    const getEndMonthFromDate = (dateStr) => {
        // Format: DD.MM-DD.MM.YY or DD.MM-DD.MM.YY.XX
        const parts = dateStr.match(/(\d{2})\.(\d{2})-(\d{2})\.(\d{2})/);
        if (parts) {
            const startDay = parseInt(parts[1]);
            const startMonth = parseInt(parts[2]);
            const endDay = parseInt(parts[3]);
            const endMonth = parseInt(parts[4]);
            // If week starts in one month and ends in another, use end month
            return endMonth;
        }
        return currentMonth;
    };

    // Find all date rows and their positions
    const dateRows = [];
    rows.forEach((row, index) => {
        for (let i = 0; i < row.length; i++) {
            if (weekRegex.test(row[i]) || weekRegex2.test(row[i])) {
                let dateVal = weekRegex2.test(row[i]) ? row[i].replace(/\. /g, '.').replace(' - ', '-') : row[i];
                dateRows.push({ row: index, date: dateVal });
                break;
            }
        }
    });

    // For each date row, find the tasks after it
    dateRows.forEach((dateInfo, i) => {
        const nextDateRow = dateRows[i + 1]?.row || rows.length;
        const taskRange = rows.slice(dateInfo.row + 1, nextDateRow);
        
        // Find the first task row (starts with a number)
        const firstTaskIndex = taskRange.findIndex(row => row[0] && /^\d+$/.test(row[0]));
        
        if (firstTaskIndex >= 0) {
            const tasks = [];
            const taskRows = taskRange.slice(firstTaskIndex);
            
            taskRows.forEach((row, idx) => {
                if (row[0] && /^\d+$/.test(row[0])) {
                    const taskData = parseTaskRow(row, config.format);
                    if (taskData.task.trim()) {
                        tasks.push({
                            id: parseInt(row[0]) || idx + 1,
                            ...taskData
                        });
                    }
                }
            });
            
            if (tasks.length > 0) {
                // Filter by current month only
                const weekEndMonth = getEndMonthFromDate(dateInfo.date);
                if (weekEndMonth === currentMonth) {
                    weeks.push({ name: dateInfo.date, tasks: tasks });
                    tasks.forEach(task => updateStats(task, stats));
                }
            }
        }
    });

    // Sort weeks by date (newest first)
    const parseWeekDate = (dateStr) => {
        const yearMatch = dateStr.match(/\.(\d{2})$/);
        const year = yearMatch ? '20' + yearMatch[1] : '2025';
        const parts = dateStr.match(/(\d{2})\.(\d{2})-(\d{2})\.(\d{2})/);
        if (parts) {
            const [, d1, m1, d2, m2] = parts;
            return new Date(year, parseInt(m2) - 1, parseInt(d2));
        }
        return new Date(0);
    };

    weeks.sort((a, b) => parseWeekDate(b.name) - parseWeekDate(a.name));

    return { weeks, stats };
};

// Специальная функция для обработки данных из таблицы "План дня руководителя"
const parseDirectorPlanData = (rows, sheetName) => {
    if (!rows || rows.length === 0) return { weeks: [], stats: { total: 0, completed: 0, inProgress: 0, notCompleted: 0 } };

    // Для таблицы "План дня руководителя" структура может быть иной
    // Обычно это текущие задачи без разделения по неделям
    
    const tasks = [];
    let stats = { total: 0, completed: 0, inProgress: 0, notCompleted: 0 };

    // Пропускаем заголовки (первые несколько строк)
    const startIndex = rows.findIndex(row => 
        row.some(cell => 
            cell && typeof cell === 'string' && 
            (cell.toLowerCase().includes('задача') || 
             cell.toLowerCase().includes('статус') || 
             cell.toLowerCase().includes('результат'))
        )
    );
    
    const dataRows = startIndex >= 0 ? rows.slice(startIndex + 1) : rows;

    // Обрабатываем строки с задачами
    dataRows.forEach((row, index) => {
        if (row && row.length >= 3) { // Должно быть как минимум ID, задача и статус
            const task = {
                id: row[0] || index + 1,
                task: row[1] || '',
                product: row[2] || '',
                status: row[3] || 'Без статуса',
                comment: row[4] || ''
            };

            if (task.task && task.task.trim() !== '') {
                tasks.push(task);
                
                // Обновляем статистику
                stats.total++;
                const statusLower = task.status.toLowerCase();
                if (statusLower.includes('выполн') || statusLower.includes('done')) {
                    stats.completed++;
                } else if (statusLower.includes('работе') || statusLower.includes('progress')) {
                    stats.inProgress++;
                } else if (statusLower.includes('не выполн') || statusLower.includes('not done')) {
                    stats.notCompleted++;
                } else {
                    // Без статуса
                }
            }
        }
    });

    // Создаем одну "неделю" с текущими задачами
    const currentDate = new Date();
    const currentWeekRange = getWeekRange(); // используем функцию для получения текущего диапазона недели
    
    return {
        weeks: [{
            name: currentWeekRange,
            tasks: tasks
        }],
        stats: stats
    };
};

const parseRoPRData = (rows) => {
    const weeks = [];
    const currentMonth = new Date().getMonth() + 1;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    
    const weekRegex = /\d{2}\.\d{2}-\d{2}\.\d{2}/;
    const sectionRegex = /(ПОКАЗАТЕЛИ|ЗАДАЧИ ПРОШЕДШЕЙ НЕДЕЛИ|ЗАДАЧИ НА ТЕКУЩУЮ НЕДЕЛЮ)/i;
    
    // Find all week blocks
    let currentBlock = null;
    let currentSection = null;
    
    rows.forEach((row, index) => {
        const rowText = row.join(' | ');
        
        // Check if this is a week date row
        for (let i = 0; i < row.length; i++) {
            if (weekRegex.test(row[i])) {
                const dateMatch = row[i].match(/(\d{2})\.(\d{2})-(\d{2})\.(\d{2})/);
                const month = dateMatch ? parseInt(dateMatch[4]) : currentMonth;
                
                // Show current month and previous month
                if (month === currentMonth || month === prevMonth) {
                    if (currentBlock) {
                        weeks.push(currentBlock);
                    }
                    currentBlock = {
                        period: row[i],
                        indicators: [],
                        pastTasks: [],
                        currentTasks: [],
                        unplannedTasks: [],
                        stats: { completed: 0, total: 0, percent: '0%' }
                    };
                    currentSection = null;
                }
                break;
            }
        }
        
        if (!currentBlock) return;
        
        // Check for section headers
        const sectionMatch = rowText.match(sectionRegex);
        if (sectionMatch) {
            const section = sectionMatch[1].toUpperCase();
            if (section === 'ПОКАЗАТЕЛИ') currentSection = 'indicators';
            else if (section === 'ЗАДАЧИ ПРОШЕДШЕЙ НЕДЕЛИ') currentSection = 'pastTasks';
            else if (section === 'ЗАДАЧИ НА ТЕКУЩУЮ НЕДЕЛЮ') currentSection = 'currentTasks';
            return;
        }
        
        // Parse indicators (row has content in col 1 and col 6)
        if (currentSection === 'indicators') {
            const name = row[1]?.trim();
            const quantity = row[6]?.trim();
            const comment = row[11]?.trim();
            if (name && name !== 'КОЛИЧЕСТВО' && name !== 'КОММЕНТАРИЙ' && name !== 'ПОКАЗАТЕЛИ') {
                // Check if it's a number row or a split row
                if (quantity && !isNaN(parseFloat(quantity.replace(',', '.')))) {
                    currentBlock.indicators.push({ name, quantity, comment: '' });
                } else if (row[7]?.trim() && row[9]?.trim()) {
                    // Split row like "Офис | 4 | Производство | 5"
                    currentBlock.indicators.push({ name: name + ' (Офис)', quantity: row[7], comment: '' });
                    currentBlock.indicators.push({ name: name + ' (Производство)', quantity: row[9], comment: '' });
                } else if (quantity || comment) {
                    currentBlock.indicators.push({ name, quantity: quantity || '', comment: comment || '' });
                }
            }
        }
        
        // Parse tasks (row starts with a number)
        if ((currentSection === 'pastTasks' || currentSection === 'currentTasks' || currentSection === 'unplannedTasks') && row[0]?.trim()) {
            const id = parseInt(row[0]);
            if (!isNaN(id)) {
                const task = {
                    id,
                    task: row[1]?.trim() || '',
                    result: row[6]?.trim() || '',
                    status: row[8]?.trim() || 'Без статуса',
                    comment: row[11]?.trim() || ''
                };
                if (task.task) {
                    if (currentSection === 'pastTasks') currentBlock.pastTasks.push(task);
                    else if (currentSection === 'currentTasks') currentBlock.currentTasks.push(task);
                    else if (currentSection === 'unplannedTasks') currentBlock.unplannedTasks.push(task);
                    
                    currentBlock.stats.total++;
                    if (task.status.toLowerCase().includes('выполнено')) currentBlock.stats.completed++;
                }
            }
        }
        
        // Parse stats row
        if (rowText.includes('из') && rowText.includes('%')) {
            const statsMatch = rowText.match(/из\s*(\d+).*?(\d+[,.]?\d*)%/);
            if (statsMatch) {
                currentBlock.stats.completed = parseInt(statsMatch[1]);
                currentBlock.stats.percent = statsMatch[2] + '%';
            }
        }
    });
    
    if (currentBlock) weeks.push(currentBlock);
    
    // Filter only current and previous month
    const filterCurrentMonth = new Date().getMonth() + 1;
    const filterPrevMonth = filterCurrentMonth === 1 ? 12 : filterCurrentMonth - 1;
    const monthsToShow = [filterCurrentMonth, filterPrevMonth];
    
    const filteredWeeks = weeks.filter(week => {
        const dateMatch = week.period.match(/(\d{2})\.(\d{2})/);
        if (dateMatch) {
            const month = parseInt(dateMatch[2]);
            return monthsToShow.includes(month);
        }
        return false;
    });
    
    // Sort weeks by date (newest first)
    const parseWeekDateForSort = (dateStr) => {
        // Match: DD.MM-DD.MM.YY or DD.MM-DD.MM
        const yearMatch = dateStr.match(/\.(\d{2})$/);
        const year = yearMatch ? '20' + yearMatch[1] : '2025';
        const parts = dateStr.match(/(\d{2})\.(\d{2})-(\d{2})\.(\d{2})/);
        if (parts) {
            const [, d1, m1, d2, m2] = parts;
            return new Date(year, parseInt(m2) - 1, parseInt(d2));
        }
        return new Date(0);
    };
    
    filteredWeeks.sort((a, b) => parseWeekDateForSort(b.period) - parseWeekDateForSort(a.period));
    
    return { weeks: filteredWeeks, stats: { total: 0, completed: 0, inProgress: 0, notCompleted: 0 } };
};

const updateStats = (task, stats) => {
    stats.total++;
    const status = (task.status || '').toLowerCase();
    if (status.includes('выполн')) stats.completed++;
    else if (status.includes('работе')) stats.inProgress++;
    else if (status.includes('не выполн')) stats.notCompleted++;
};

const parseTaskRow = (row, format) => {
    switch(format) {
        case 'np':
            // ["1", "Задача", "ПРОДУКТ", "РЕЗУЛЬТАТ (содержит статус)", "КОММЕНТАРИЙ"]
            return { task: row[1] || '', product: row[2] || '', comment: row[4] || '', status: row[3] || 'Без статуса' };
        case 'gi':
            // ["№", "Задача", "", "РЕЗУЛЬТАТ", "КОММЕНТАРИЙ", "ИТОГ (статус)"]
            return { task: row[1] || '', product: row[2] || '', comment: row[3] || '', status: row[4] || 'Без статуса' };
        case 'kd':
            // ["№","ЗАДАЧИ","ПРОДУКТ","РЕЗУЛЬТАТ","КОММЕНТАРИЙ"]
            return { task: row[1] || '', product: row[2] || '', comment: row[4] || '', status: row[3] || 'Без статуса' };
        case 'rop':
            // ["1", "Задача", "", "", "", "", "продукт", "", "", "статус"]
            return { task: row[1] || '', product: row[6] || '', comment: row[7] || '', status: row[9] || 'Без статуса' };
        case 'rom':
            // РОМ - different format, показатели
            return { task: row.join(' | ').substring(0, 100), product: '', comment: '', status: 'Без статуса' };
        case 'ropr':
            // ["", 1: "Задача", "", ..., 6: "количество", ..., 10: "комментарий"]
            return { task: row[1] || '', product: row[6] || '', comment: row[9] || '', status: row[10] || 'Без статуса' };
        case 'rso':
            // ["1", "Задача", "Продукт", "Результат", "Комментарий"]
            return { task: row[1] || '', product: row[2] || '', comment: row[3] || '', status: row[4] || 'Без статуса' };
        default:
            return { task: row[2] || '', product: row[3] || '', comment: row[4] || '', status: row[5] || 'Без статуса' };
    }
};


window.importFromSheets = async () => {
    const url = document.getElementById('sheetsUrl').value;
    const sheetName = document.getElementById('sheetName').value;
    
    if (!url) {
        alert('Введите ссылку на таблицу');
        return;
    }
    
    if (!confirm('Импортировать данные из таблицы в систему?')) return;
    
    try {
        const response = await fetch('/api/sheets/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, sheetName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Успешно импортировано ${data.imported} отчетов!`);
            await api.fetchReports();
            render();
        } else {
            alert('Ошибка импорта: ' + data.error);
        }
    } catch (e) {
        alert('Ошибка: ' + e.message);
    }
};

window.syncFromSheets = async () => {
    try {
        const response = await fetch('/api/sheets/sync');
        const data = await response.json();
        if (data.success) {
            renderSheetsTable(data.rows);
        }
    } catch (e) {
        alert('Ошибка синхронизации: ' + e.message);
    }
};

const renderSheetsTable = (rows) => {
    const tbody = document.getElementById('sheetsTableBody');
    if (!tbody) {
        console.error('Элемент с ID "sheetsTableBody" не найден в DOM');
        return;
    }
    
    if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-8 text-center text-slate-400">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map(row => `
        <tr class="hover:bg-slate-50 border-b border-slate-100">
            <td class="px-3 py-2 text-slate-700">${row.date || '-'}</td>
            <td class="px-3 py-2 font-bold text-slate-800">${row.department || '-'}</td>
            <td class="px-3 py-2 text-slate-600">${row.task || '-'}</td>
            <td class="px-3 py-2">
                <span class="px-2 py-0.5 rounded text-xs font-bold ${getStatusClass(row.status)}">${row.status || '-'}</span>
            </td>
            <td class="px-3 py-2 text-slate-500">${row.result || '-'}</td>
        </tr>
    `).join('');
};

const getStatusClass = (status) => {
    if (status?.toLowerCase().includes('не выполн')) return 'bg-red-100 text-red-700 border-red-200';
    if (status?.toLowerCase().includes('выполн')) return 'bg-green-100 text-green-700 border-green-200';
    if (status?.toLowerCase().includes('работе')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (status?.toLowerCase().includes('без статуса')) return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
};

const parseRSOData = (rows) => {
    const weeks = [];
    let currentBlock = null;

    const weekRegex = /\d{2}\.\d{2}-\d{2}\.\d{2}(\.\d{2})?/;

    // Helper function to get end month from week date (for filtering by current month)
    const getEndMonthFromDate = (dateStr) => {
        // Format: DD.MM-DD.MM.YY or DD.MM-DD.MM.YY.XX
        const parts = dateStr.match(/(\d{2})\.(\d{2})-(\d{2})\.(\d{2})/);
        if (parts) {
            const startDay = parseInt(parts[1]);
            const startMonth = parseInt(parts[2]);
            const endDay = parseInt(parts[3]);
            const endMonth = parseInt(parts[4]);
            // If week starts in one month and ends in another, use end month
            return endMonth;
        }
        return new Date().getMonth() + 1;
    };
    
    rows.forEach((row) => {
        const rowText = row.join(' | ');
        
        // Check for week date
        for (let i = 0; i < row.length; i++) {
            if (weekRegex.test(row[i])) {
                if (currentBlock) weeks.push(currentBlock);
                currentBlock = {
                    period: row[i],
                    tasks: [],
                    stats: { completed: 0, total: 0, percent: '0%' }
                };
                break;
            }
        }
        
        if (!currentBlock) return;
        
        // Skip header rows
        if (row[0] === '№' || row[1]?.includes('ЗАДАЧИ')) return;
        if (row[0] === 'ПОКАЗАТЕЛИ') return;
        if (row[0] === 'Неделя') return;
        
        // Check for task row (starts with number)
        if (row[0] && /^\d+$/.test(row[0])) {
            const task = {
                id: parseInt(row[0]),
                task: row[1] || '',
                product: row[2] || '',
                status: row[3] || 'Без статуса',
                comment: row[4] || ''
            };
            if (task.task && task.task !== 'незапланированные задачи') {
                currentBlock.tasks.push(task);
            }
        }
        
        // Stats row - format: "Выполнено задач в неделю: | | 0 | из | 14"
        if (rowText.includes('из') && !isNaN(parseInt(row[2]))) {
            currentBlock.stats.completed = parseInt(row[2]);
            for (let i = 0; i < row.length; i++) {
                if (row[i] === 'из' && row[i+1]) {
                    currentBlock.stats.total = parseInt(row[i+1]);
                    break;
                }
            }
        }
    });
    
    if (currentBlock) weeks.push(currentBlock);
    
    // Sort by date (newest first)
    const parseWeekDate = (dateStr) => {
        // Check if year is included in the date string (format: DD.MM-DD.MM.YY)
        const yearMatch = dateStr.match(/\.(\d{2})$/);
        const currentYear = new Date().getFullYear();
        const currentCentury = Math.floor(currentYear / 100) * 100; // 2000 for years in 2000s
        
        // Extract the year from the date string or use current year logic
        let year = currentYear;
        if (yearMatch) {
            const yearSuffix = parseInt(yearMatch[1]);
            // Determine if it's 2025, 2026, etc. based on the current year
            // If the suffix is close to current year's suffix, use current century
            const currentYearSuffix = currentYear % 100;
            
            // If the parsed year suffix is greater than current but within reasonable range, 
            // assume it belongs to current century
            if (yearSuffix >= currentYearSuffix && yearSuffix <= currentYearSuffix + 2) {
                year = currentCentury + yearSuffix;
            } else if (yearSuffix < currentYearSuffix && yearSuffix >= currentYearSuffix - 10) {
                // For dates that might be from previous years but close to current
                year = currentCentury + yearSuffix;
            } else if (yearSuffix > currentYearSuffix + 2) {
                // If the year suffix is much higher, it might be from previous century
                year = (currentCentury - 100) + yearSuffix;
            } else {
                // Default to current year
                year = currentYear;
            }
        }
        
        const parts = dateStr.match(/(\d{2})\.(\d{2})-(\d{2})\.(\d{2})/);
        if (parts) {
            const [, d1, m1, d2, m2] = parts;
            // Use the end date of the week for sorting purposes
            return new Date(year, parseInt(m2) - 1, parseInt(d2));
        }
        return new Date(0);
    };

    // Filter weeks by current month only
    const currentMonth = new Date().getMonth() + 1;
    const filteredWeeks = weeks.filter(week => {
        const weekEndMonth = getEndMonthFromDate(week.period);
        return weekEndMonth === currentMonth;
    });

    // Calculate stats for current month only
    const currentMonthStats = { total: 0, completed: 0, inProgress: 0, notCompleted: 0 };
    filteredWeeks.forEach(week => {
        week.tasks.forEach(task => updateStats(task, currentMonthStats));
    });

    filteredWeeks.sort((a, b) => parseWeekDate(b.period) - parseWeekDate(a.period));

    return { weeks: filteredWeeks, stats: currentMonthStats };
};

// --- INIT ---
const init = async () => {
    if (!checkAuth()) return;

    state.view = 'sheets';
    setInterval(checkDeadline, 60000);
    checkDeadline();
    await loadAllDepartments();
    render();

    // Скрываем спиннер загрузки и показываем основной контент
    const spinner = document.getElementById('loading-spinner');
    const app = document.getElementById('app');

    if (spinner) {
        spinner.style.display = 'none';
    }

    if (app) {
        app.classList.remove('hidden');
    }
};

// --- LOADING INDICATORS ---
const showLoadingIndicator = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex items-center justify-center p-8" role="status" aria-live="polite">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
                <span>Загрузка...</span>
            </div>`;
    }
};

const hideLoadingIndicator = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
};

document.addEventListener('DOMContentLoaded', init);
