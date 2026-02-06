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
    department: null,
    reportType: 'weekly',
    period: { week_dates: getWeekRange(), is_manual: false },
    kpis: {
        deals: { quantity: 0, description: '' },
        meetings: { quantity: 0, description: '' },
        training: { quantity: 0, description: '' }
    },
    kdIndicators: {},
    tasks: [{ id: generateId(), task_text: '', product: '', status: 'Без статуса', comment: '', focus: false }],
    unplannedTasks: [],
    history: [],
    view: 'select-dept',
    isLocked: false,
    isSubmitting: false,
    editingId: null,
    deadlinePassed: false
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
window.updateKpi = (key, field, val) => { state.kpis[key][field] = val; };
window.updateKdIndicator = (key, field, val) => { state.kdIndicators[key][field] = val; };
window.updateTask = (id, field, val) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) task[field] = val;
};
window.updateUnplanned = (id, field, val) => {
    const task = state.unplannedTasks.find(t => t.id === id);
    if (task) task[field] = val;
};
window.addTask = () => {
    if (state.isLocked) return;
    state.tasks.push({ id: generateId(), task_text: '', product: '', status: 'Без статуса', comment: '', focus: false });
    render();
};
window.removeTask = (id) => {
    if (state.isLocked) return;
    state.tasks = state.tasks.filter(t => t.id !== id);
    render();
};
window.addUnplanned = () => {
    if (state.isLocked) return;
    state.unplannedTasks.push({ id: generateId(), task_text: '', product: '', status: 'Без статуса' });
    render();
};
window.removeUnplanned = (id) => {
    if (state.isLocked) return;
    state.unplannedTasks = state.unplannedTasks.filter(t => t.id !== id);
    render();
};
window.toggleTaskFocus = (id) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) { task.focus = !task.focus; }
};
window.toggleUnplannedFocus = (id) => {
    const task = state.unplannedTasks.find(t => t.id === id);
    if (task) { task.focus = !task.focus; }
};
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
    const defaultSheetNames = ['НП', 'ГИ', 'КД', 'РОП', 'РОМ', 'РОПР', 'РСО'];
    
    // Calculate overall statistics
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let notCompletedTasks = 0;
    
    Object.values(departmentsData).forEach(deptData => {
        totalTasks += deptData.stats?.total || 0;
        completedTasks += deptData.stats?.completed || 0;
        inProgressTasks += deptData.stats?.inProgress || 0;
        notCompletedTasks += deptData.stats?.notCompleted || 0;
    });
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return `
    <div class="animate-fade-in">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b-2 border-slate-900">
            <div>
                <h1 class="text-xl md:text-3xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <i data-lucide="table" class="w-7 h-7 text-green-600"></i>
                    Отчеты по отделам
                </h1>
                <p class="text-xs text-slate-500 mt-0.5">${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="loadAllDepartments()" class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase rounded flex items-center gap-1">
                    <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                    Обновить
                </button>
            </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
            <div class="bg-white border-2 border-slate-200 rounded-lg p-3 text-center">
                <div class="text-2xl sm:text-3xl font-black text-slate-900">${totalTasks}</div>
                <div class="text-xs text-slate-500 font-bold uppercase">Всего</div>
            </div>
            <div class="bg-white border-2 border-green-200 rounded-lg p-3 text-center">
                <div class="text-2xl sm:text-3xl font-black text-green-600">${completedTasks}</div>
                <div class="text-xs text-green-600 font-bold uppercase">Выполнено</div>
            </div>
            <div class="bg-white border-2 border-blue-200 rounded-lg p-3 text-center">
                <div class="text-2xl sm:text-3xl font-black text-blue-600">${inProgressTasks}</div>
                <div class="text-xs text-blue-600 font-bold uppercase">В работе</div>
            </div>
            <div class="bg-white border-2 border-red-200 rounded-lg p-3 text-center">
                <div class="text-2xl sm:text-3xl font-black text-red-600">${notCompletedTasks}</div>
                <div class="text-xs text-red-600 font-bold uppercase">Не выполнено</div>
            </div>
            <div class="bg-slate-900 rounded-lg p-3 text-center">
                <div class="text-2xl sm:text-3xl font-black text-white">${completionRate}%</div>
                <div class="text-xs text-slate-400 font-bold uppercase">Выполняемость</div>
            </div>
        </div>

        <div class="bg-white border-2 border-slate-200 rounded-lg overflow-hidden mb-4">
            <div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2">
                <h2 class="font-bold text-slate-800 flex items-center gap-2">
                    <i data-lucide="users" class="w-4 h-4 text-green-600"></i>
                    Отделы
                </h2>
                <span class="text-xs text-slate-500">${Object.keys(departmentsData).length} из ${defaultSheetNames.length} загружено</span>
            </div>
            <div class="p-2 overflow-x-auto">
                <div class="flex gap-1" id="departmentGrid">
                    ${defaultSheetNames.map(sheet => {
                        const deptData = departmentsData[sheet] || { stats: { total: 0, completed: 0 } };
                        const deptCompletion = deptData.stats?.total > 0 ? Math.round((deptData.stats.completed / deptData.stats.total) * 100) : 0;
                        return `
                            <button onclick="switchDepartment('${sheet}')" class="department-btn flex-1 min-w-[80px] p-2 rounded-lg border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all text-center ${currentDepartment === sheet ? 'border-green-600 bg-green-50' : ''}" data-dept="${sheet}">
                                <div class="font-bold text-sm text-slate-900">${sheet}</div>
                                <div class="text-xs text-slate-500">${deptData.stats?.total || 0} задач</div>
                                <div class="text-xs font-bold ${deptCompletion >= 70 ? 'text-green-600' : deptCompletion >= 40 ? 'text-yellow-600' : 'text-red-600'}">${deptCompletion}%</div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>

        <div class="bg-white border-2 border-slate-200 rounded-lg overflow-hidden">
            <div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <h2 class="font-bold text-slate-800 flex items-center gap-2">
                    <i data-lucide="list" class="w-4 h-4 text-green-600"></i>
                    <span id="deptTitle">${currentDepartment}</span>
                </h2>
                <div class="flex gap-1">
                    <button onclick="importDepartment()" class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-1">
                        <i data-lucide="download" class="w-3 h-3"></i>
                        Импорт
                    </button>
                </div>
            </div>
            <div class="overflow-x-auto custom-scrollbar">
                ${renderDepartmentTasks(currentDepartment)}
            </div>
        </div>
    </div>
`;
};

const renderDepartmentTasks = (department) => {
    const data = departmentsData[department];
    
    if (!data || !data.weeks || data.weeks.length === 0) {
        return '<div class="p-8 text-center text-slate-400">Нет данных. Нажмите "Обновить" для загрузки.</div>';
    }
    
    return data.weeks.map((week, weekIndex) => {
        const weekCompleted = week.tasks.filter(t => (t.status || '').toLowerCase().includes('выполн')).length;
        const weekTotal = week.tasks.length;
        const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
        
        return `
            <div class="border-b border-slate-200 last:border-0">
                <div class="bg-slate-100 px-4 py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <div class="flex items-center gap-2">
                        <i data-lucide="calendar" class="w-4 h-4 text-slate-600"></i>
                        <span class="font-bold text-slate-800">${week.name}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs">
                        <span class="text-slate-500">${weekCompleted}/${weekTotal} задач</span>
                        <span class="px-2 py-0.5 rounded font-bold ${weekPercent >= 70 ? 'bg-green-100 text-green-700' : weekPercent >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">${weekPercent}%</span>
                    </div>
                </div>
                <table class="w-full text-sm">
                    <thead class="bg-white border-b border-slate-100">
                        <tr>
                            <th class="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase w-10">№</th>
                            <th class="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase">Задача</th>
                            <th class="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase w-32">Продукт</th>
                            <th class="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase w-40 hidden md:table-cell">Результат</th>
                            <th class="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase w-24">Статус</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${week.tasks.map(task => `
                            <tr class="hover:bg-slate-50">
                                <td class="px-3 py-2 text-slate-700 font-medium">${task.id}</td>
                                <td class="px-3 py-2 text-slate-900 font-medium">${task.task}</td>
                                <td class="px-3 py-2 text-slate-600 text-xs">${task.product || '-'}</td>
                                <td class="px-3 py-2 text-slate-500 text-xs hidden md:table-cell">${task.comment || '-'}</td>
                                <td class="px-3 py-2">
                                    <span class="px-2 py-0.5 rounded text-xs font-bold ${getStatusClass(task.status)}">${task.status}</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }).join('');
};

window.switchDepartment = (dept) => {
    currentDepartment = dept;

    document.querySelectorAll('.department-btn').forEach(btn => {
        if (btn.dataset.dept === dept) {
            btn.classList.add('border-green-600', 'bg-green-50');
            btn.classList.remove('border-slate-200');
        } else {
            btn.classList.remove('border-green-600', 'bg-green-50');
            btn.classList.add('border-slate-200');
        }
    });

    const titleEl = document.getElementById('currentDepartmentTitle');
    if (titleEl) titleEl.textContent = dept;

    renderDepartmentData(dept);
    if (typeof lucide !== 'undefined') lucide.createIcons();
};
window.setDirectorFilter = (type) => {
    state.reportType = type;
    render();
};
window.setDashboardFilter = (type) => {
    state.reportType = type;
    render();
};

window.submitReport = async () => {
    if (state.isLocked || state.isSubmitting) return;
    
    state.isSubmitting = true;
    render();

    const total = state.tasks.length;
    const done = state.tasks.filter(t => t.status === 'Выполнено').length;
    const report = {
        id: state.editingId || generateId(),
        department: state.department,
        report_type: state.reportType,
        period: { ...state.period },
        kpi_indicators: { ...state.kpis },
        tasks: [...state.tasks],
        unplanned_tasks: [...state.unplannedTasks],
        calculated_stats: { done, total, percent: total > 0 ? Math.round((done/total)*100) : 0 },
        created_at: new Date().toISOString()
    };

    try {
        const res = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report)
        });
        if (res.ok) {
            await api.fetchReports();
            state.isLocked = true;
            state.editingId = report.id;
        }
    } catch (e) {
        console.error(e);
    }
    state.isSubmitting = false;
    render();
};

window.resetForm = () => {
    state.isLocked = false;
    state.editingId = null;
    state.tasks = [{ id: generateId(), task_text: '', product: '', status: 'Без статуса', comment: '', focus: false }];
    state.unplannedTasks = [];
    state.period.week_dates = getWeekRange();
    if (state.department === 'КД') {
        state.kdIndicators = {
            contracts_count: { quantity: 0, description: '' },
            contracts_amount: { quantity: 0, description: '' },
            deals_in_work: { quantity: 0, amount: 0, description: '' },
            tenders_in_work: { quantity: 0, amount: 0, description: '' },
            effective_calls: { quantity: 0, description: '' },
            tcp_sent: { quantity: 0, description: '' },
            turnover_plan: { quantity: 0, description: '' },
            margin_plan: { quantity: 0, description: '' },
            meetings_op: { quantity: 0, description: '' },
            trainings_op: { quantity: 0, description: '' },
            applications_tki: { quantity: 0, description: '' },
            calculated_applications: { quantity: 0, description: '' }
        };
        state.kpis = { deals: { quantity: 0, description: '' }, meetings: { quantity: 0, description: '' }, training: { quantity: 0, description: '' } };
    } else {
        state.kpis = { deals: { quantity: 0, description: '' }, meetings: { quantity: 0, description: '' }, training: { quantity: 0, description: '' } };
    }
    render();
};

window.selectDept = (dept) => {
    state.department = dept;
    state.reportType = 'weekly';
    state.period.week_dates = getWeekRange();
    
    if (dept === 'КД') {
        state.kdIndicators = {
            contracts_count: { quantity: 0, description: '' },
            contracts_amount: { quantity: 0, description: '' },
            deals_in_work: { quantity: 0, amount: 0, description: '' },
            tenders_in_work: { quantity: 0, amount: 0, description: '' },
            effective_calls: { quantity: 0, description: '' },
            tcp_sent: { quantity: 0, description: '' },
            turnover_plan: { quantity: 0, description: '' },
            margin_plan: { quantity: 0, description: '' },
            meetings_op: { quantity: 0, description: '' },
            trainings_op: { quantity: 0, description: '' },
            applications_tki: { quantity: 0, description: '' },
            calculated_applications: { quantity: 0, description: '' }
        };
        state.tasks = [];
        state.kpis = { deals: { quantity: 0, description: '' }, meetings: { quantity: 0, description: '' }, training: { quantity: 0, description: '' } };
    } else if (dept === 'ГИ') {
        state.tasks = [];
        state.kpis = { deals: { quantity: 0, description: '' }, meetings: { quantity: 0, description: '' }, training: { quantity: 0, description: '' } };
    } else {
        state.tasks = [{ id: generateId(), task_text: '', product: '', status: 'Без статуса', comment: '', focus: false }];
        state.kdIndicators = {};
    }
    state.unplannedTasks = [];
    state.view = 'create';
    render();
};

window.editReport = (id) => {
    const report = state.history.find(r => r.id === id);
    if (!report) return;
    
    state.editingId = report.id;
    state.department = report.department;
    state.reportType = report.report_type;
    state.period = { ...report.period };
    state.kpis = { ...report.kpi_indicators };
    state.tasks = report.tasks.map(t => ({ ...t }));
    state.unplannedTasks = report.unplanned_tasks.map(t => ({ ...t }));
    state.view = 'create';
    render();
};

// --- RENDER FUNCTIONS ---
const render = () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    const app = document.getElementById('app');
    let content = '';
    
    content += `<div id="banner"></div>`;

    content += `
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-900 z-50 flex justify-around p-0 md:hidden safe-area-pb">
        <button onclick="navigate('sheets')" class="flex flex-col items-center justify-center p-3 w-full font-bold uppercase tracking-wider text-[10px] ${state.view === 'sheets' ? 'bg-green-600 text-white' : 'bg-white text-slate-500'} touch-manipulation">
            <i data-lucide="table" class="mb-1 w-5 h-5"></i> Отчеты
        </button>
        <button onclick="navigate('select-dept')" class="flex flex-col items-center justify-center p-3 w-full font-bold uppercase tracking-wider text-[10px] ${state.view === 'create' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'} touch-manipulation">
            <i data-lucide="file-edit" class="mb-1 w-5 h-5"></i> Заполнить
        </button>
        <button onclick="selectDirectorView()" class="flex flex-col items-center justify-center p-3 w-full font-bold uppercase tracking-wider text-[10px] ${state.view === 'director' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'} touch-manipulation">
            <i data-lucide="eye" class="mb-1 w-5 h-5"></i> Директор
        </button>
    </div>`;

    content += `<div class="max-w-4xl mx-auto p-2 sm:p-4 md:p-8 space-y-4 sm:space-y-6 pb-20 sm:pb-8">`;

    if (state.view === 'select-dept') {
        content = renderDeptSelector();
    } else if (state.view === 'director') {
        content = renderDirectorView();
    } else {
        content = renderGoogleSheetsDashboard();
    }

    content += `</div>`;
    
    app.innerHTML = content;
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

const renderDeptSelector = () => {
    return `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-2 sm:p-4">
        <div class="max-w-2xl w-full bg-white shadow-lg border-2 border-slate-900 p-3 sm:p-6 md:p-10 animate-fade-in">
            <h1 class="text-xl sm:text-3xl font-extrabold text-center mb-3 sm:mb-2 uppercase tracking-tight text-slate-900">Выберите отдел</h1>
            <div class="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-3 max-h-[60vh] sm:max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar mt-3 sm:mt-6">
                ${DEPARTMENTS.map(dept => `
                    <button onclick="selectDept('${dept}')" class="group relative flex flex-col items-center justify-center p-2 sm:p-4 border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all active:scale-95 touch-manipulation min-h-[50px] sm:min-h-[80px]">
                        <span class="font-extrabold text-slate-700 text-xs sm:text-lg group-hover:text-indigo-700">${dept}</span>
                    </button>
                `).join('')}
            </div>
            <div class="mt-3 sm:mt-6 text-center space-y-2">
                <button onclick="navigate('sheets')" class="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center touch-manipulation">
                    <i data-lucide="table" class="mr-1.5 w-4 h-4"></i> Отчеты Google
                </button>
                <button onclick="selectDirectorView()" class="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center touch-manipulation">
                    <i data-lucide="eye" class="mr-1.5 w-4 h-4"></i> Режим директора
                </button>
            </div>
        </div>
    </div>`;
};

const renderForm = () => {
    return `
    <div class="space-y-3 sm:space-y-6 animate-fade-in ${state.isLocked ? 'opacity-80' : ''}">
        <header class="bg-white border-2 border-slate-900 relative shadow-[4px_4px_0px_0px_rgba(15,23,42,0.1)]">
            ${state.isLocked ? '<div class="absolute inset-0 z-10 bg-slate-100/50 cursor-not-allowed"></div>' : ''}
            <div class="bg-slate-900 text-white p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div class="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div class="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-600 flex items-center justify-center shrink-0 border-2 border-white/20 shadow-lg">
                       <i data-lucide="building-2" class="text-white w-6 h-6 sm:w-8 sm:h-8"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-indigo-300 mb-1">Отдел</div>
                        <div class="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-none text-white truncate">${state.department}</div>
                    </div>
                </div>
            </div>
            <div class="p-3 sm:p-6 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 border-t-4 border-indigo-600">
                <div class="flex flex-col gap-2 w-full sm:w-auto">
                     <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Тип отчета</p>
                     <div class="flex items-center gap-0 bg-white border-2 border-slate-200 p-1 rounded-none shadow-sm w-full sm:w-fit">
                        <button onclick="toggleType('weekly')" class="flex-1 sm:flex-none px-3 sm:px-6 py-2.5 sm:py-2 text-xs sm:text-xs font-bold uppercase tracking-wider transition-all ${state.reportType === 'weekly' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}">Неделя</button>
                        <button onclick="toggleType('monthly')" class="flex-1 sm:flex-none px-3 sm:px-6 py-2.5 sm:py-2 text-xs sm:text-xs font-bold uppercase tracking-wider transition-all ${state.reportType === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}">Месяц</button>
                    </div>
                </div>
                <div class="w-full sm:w-auto flex flex-col items-start sm:items-end">
                     <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">${state.reportType === 'weekly' ? 'Период' : 'Месяц'}</p>
                     <div class="w-full sm:w-auto flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-900 shadow-sm hover:border-indigo-600 transition-colors">
                        <i data-lucide="calendar" class="${state.reportType === 'monthly' ? 'text-indigo-600' : 'text-slate-900'} w-5 h-5 sm:w-6 sm:h-6"></i>
                        <input type="text" value="${state.period.week_dates}" onchange="updatePeriod(this.value)" ${state.isLocked ? 'disabled' : ''} class="bg-transparent border-none p-0 text-sm sm:text-xl font-extrabold focus:outline-none w-full sm:w-44 font-mono uppercase truncate" />
                     </div>
                </div>
            </div>
        </header>

        ${state.department === 'КД' ? `
        <section class="space-y-3 sm:space-y-4">
            <h2 class="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide"><i data-lucide="bar-chart-3" class="text-blue-600 w-5 h-5"></i>Показатели</h2>
            <div class="bg-white border-2 border-slate-300 space-y-0 divide-y divide-slate-200">
                ${renderKdIndicatorRow('contracts_count', 'Кол. контрактов', 'file-text', 'blue')}
                ${renderKdIndicatorRow('contracts_amount', 'Сумма контрактов', 'dollar-sign', 'blue')}
                ${renderKdDoubleIndicatorRow('deals_in_work', 'Сделки в работе', 'trending-up', 'blue')}
                ${renderKdDoubleIndicatorRow('tenders_in_work', 'Тендеры в работе', 'briefcase', 'blue')}
                ${renderKdIndicatorRow('effective_calls', 'Звонки ОП', 'phone', 'blue')}
                ${renderKdIndicatorRow('tcp_sent', 'ТКП направлено', 'send', 'blue')}
                ${renderKdIndicatorRow('turnover_plan', 'План оборота', 'target', 'blue')}
                ${renderKdIndicatorRow('margin_plan', 'План маржи', 'percent', 'blue')}
                ${renderKdIndicatorRow('meetings_op', 'Планерки ОП', 'users', 'blue')}
                ${renderKdIndicatorRow('trainings_op', 'Обучения ОП', 'graduation-cap', 'blue')}
                ${renderKdIndicatorRow('applications_tki', 'Заявок ТКИ', 'clipboard', 'blue')}
                ${renderKdIndicatorRow('calculated_applications', 'Рассчитано', 'calculator', 'blue')}
            </div>
        </section>
        ` : state.department !== 'ГИ' ? `
        <section class="space-y-3 sm:space-y-4">
            <h2 class="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide"><i data-lucide="bar-chart-3" class="text-blue-600 w-5 h-5"></i>Показатели</h2>
            <div class="bg-white border-2 border-slate-300">
                 ${renderKpiRow('deals', 'Сделки', 'briefcase', 'blue')}
                 ${renderKpiRow('meetings', 'Планерки', 'users', 'blue')}
                 ${renderKpiRow('training', 'Обучение', 'graduation-cap', 'blue')}
            </div>
        </section>` : ''}

        ${state.department !== 'ГИ' ? `
        <section class="space-y-3 sm:space-y-4">
             <h2 class="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide"><i data-lucide="check-circle-2" class="text-emerald-600 w-5 h-5"></i>Задачи</h2>
             <div class="space-y-3 sm:space-y-4">
                ${state.tasks.map((task, i) => renderTaskRow(task, i)).join('')}
             </div>
             ${!state.isLocked ? `<button onclick="addTask()" class="w-full py-4 border-2 border-dashed border-slate-400 text-slate-500 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 transition-all font-bold uppercase tracking-wide flex items-center justify-center text-sm touch-manipulation"><i data-lucide="plus" class="mr-2 w-4 h-4"></i> Добавить задачу</button>` : ''}
        </section>` : ''}

        <section class="space-y-3 sm:space-y-4">
             <h2 class="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide"><i data-lucide="alert-circle" class="text-amber-600 w-5 h-5"></i>Вне плана</h2>
             <div class="bg-amber-50 border-2 border-amber-200 p-3 sm:p-6 space-y-3 sm:space-y-4">
                ${state.unplannedTasks.length === 0 ? '<p class="text-sm text-slate-400 text-center py-2 font-medium">Нет незапланированных задач</p>' : ''}
                ${state.unplannedTasks.map(task => renderUnplannedRow(task)).join('')}
                ${!state.isLocked ? `<button onclick="addUnplanned()" class="w-full sm:w-auto bg-white border-2 border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white font-bold py-3 px-6 uppercase text-xs tracking-wider transition-colors flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(245,158,11,0.2)] touch-manipulation"><i data-lucide="plus" class="mr-2 w-4 h-4"></i> Добавить</button>` : ''}
             </div>
        </section>

        <footer class="bg-slate-900 text-white p-4 sm:p-6 md:p-8 border-t-4 border-indigo-500 mb-4 sm:mb-8 flex justify-center">
            ${state.isLocked 
                ? `<button onclick="resetForm()" class="w-full max-w-md bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 uppercase tracking-widest text-sm flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] touch-manipulation"><i data-lucide="refresh-cw" class="mr-3"></i> Сменить отдел</button>`
                : `<button onclick="submitReport()" ${state.isSubmitting ? 'disabled' : ''} class="w-full max-w-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 uppercase tracking-widest text-sm flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] touch-manipulation">
                    ${state.isSubmitting ? '<i data-lucide="loader-2" class="mr-3 animate-spin"></i> Сохранение...' : `<i data-lucide="save" class="mr-3"></i> ${state.editingId ? 'Обновить' : 'Сохранить'}`}
                  </button>`
            }
        </footer>
    </div>`;
};

const renderKpiRow = (key, title, icon, color) => {
    return `
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start sm:items-center p-3 sm:p-4 border-b last:border-0 border-slate-200 hover:bg-slate-50">
        <div class="sm:col-span-4 flex items-center gap-2 sm:gap-3 font-bold text-slate-700 mb-2 sm:mb-0">
            <div class="p-1.5 sm:p-2 shrink-0 border bg-${color}-100 text-${color}-700 border-${color}-200"><i data-lucide="${icon}" class="w-4 h-4 sm:w-5 sm:h-5"></i></div>
            <span class="text-sm sm:text-base uppercase tracking-tight truncate">${title}</span>
        </div>
        <div class="sm:col-span-3 w-full">
            <input type="number" value="${state.kpis[key].quantity}" oninput="updateKpi('${key}', 'quantity', this.value)" ${state.isLocked ? 'disabled' : ''} class="w-full px-2 sm:px-3 py-2.5 sm:py-2 bg-white text-slate-900 text-sm sm:text-base border-2 border-slate-300 focus:outline-none focus:border-blue-600 font-mono text-center h-10 sm:h-[42px] touch-manipulation" placeholder="0">
        </div>
        <div class="sm:col-span-5 w-full">
            <textarea rows="1" oninput="updateKpi('${key}', 'description', this.value)" ${state.isLocked ? 'disabled' : ''} class="w-full px-2 sm:px-3 py-2 bg-white text-slate-900 text-sm sm:text-base border-2 border-slate-300 focus:outline-none focus:border-blue-600 resize-none overflow-hidden min-h-10 sm:min-h-[42px] leading-normal touch-manipulation" placeholder="Описание">${state.kpis[key].description}</textarea>
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
    <div class="border-2 border-slate-300 p-3 relative group bg-white hover:border-slate-400 touch-manipulation">
        <div class="flex justify-end items-center mb-2 sm:hidden">
            <button onclick="removeTask('${task.id}')" class="p-2 text-slate-400 hover:text-red-600 touch-manipulation"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3">
            <div class="sm:col-span-5">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Задача</label>
                <textarea rows="1" oninput="updateTask('${task.id}', 'task_text', this.value)" class="w-full px-3 py-2.5 bg-slate-50 text-slate-900 text-sm border-2 border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-600 resize-none overflow-hidden min-h-10" placeholder="Суть задачи">${task.task_text}</textarea>
            </div>
            <div class="sm:col-span-4">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Результат</label>
                <textarea rows="1" oninput="updateTask('${task.id}', 'product', this.value)" class="w-full px-3 py-2.5 bg-slate-50 text-slate-900 text-sm border-2 border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-600 resize-none overflow-hidden min-h-10" placeholder="Ожидаемый итог">${task.product}</textarea>
            </div>
            <div class="sm:col-span-3">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Статус</label>
                <div class="relative">
                    <select onchange="updateTask('${task.id}', 'status', this.value)" class="w-full px-3 py-2.5 h-10 border-2 appearance-none text-sm font-bold focus:outline-none ${status.color} touch-manipulation">
                        ${STATUS_OPTIONS.map(opt => `<option value="${opt.value}" class="bg-white text-slate-900" ${task.status === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="hidden sm:flex sm:col-span-12 items-center justify-between gap-3 pt-2 border-t border-slate-100 mt-2">
                <label class="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                    <input type="checkbox" onchange="toggleTaskFocus('${task.id}')" ${task.focus ? 'checked' : ''} class="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 touch-manipulation">
                    В фокусе
                </label>
                <button onclick="removeTask('${task.id}')" class="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 h-10 flex items-center justify-center touch-manipulation"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </div>
        <div class="mt-3 pt-2 border-t border-slate-100">
             <div class="flex items-center gap-2">
                 <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Комментарий:</label>
                 <textarea rows="1" oninput="updateTask('${task.id}', 'comment', this.value)" class="w-full px-2 py-1.5 text-sm text-slate-700 italic bg-transparent border-b border-slate-200 hover:border-slate-400 focus:border-indigo-600 focus:outline-none resize-none overflow-hidden min-h-[30px]" placeholder="Примечания...">${task.comment}</textarea>
             </div>
        </div>
    </div>`;
};

const renderUnplannedRow = (task) => {
    const status = STATUS_OPTIONS.find(s => s.value === task.status) || STATUS_OPTIONS[3];
    return `
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-white p-3 sm:p-4 border border-amber-300 shadow-sm">
        <div class="sm:col-span-5 w-full">
           <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block sm:hidden">Задача</label>
           <textarea rows="1" oninput="updateUnplanned('${task.id}', 'task_text', this.value)" class="w-full px-3 py-2.5 bg-transparent text-slate-900 text-sm border-2 border-slate-200 focus:border-amber-500 focus:outline-none resize-none overflow-hidden min-h-10" placeholder="Что прилетело?">${task.task_text}</textarea>
        </div>
        <div class="sm:col-span-4 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block sm:hidden">Результат</label>
          <textarea rows="1" oninput="updateUnplanned('${task.id}', 'product', this.value)" class="w-full px-3 py-2.5 bg-transparent text-slate-900 text-sm border-2 border-slate-200 focus:border-amber-500 focus:outline-none resize-none overflow-hidden min-h-10" placeholder="Результат">${task.product}</textarea>
        </div>
        <div class="sm:col-span-3 flex flex-col gap-2">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0 sm:hidden">Статус</label>
          <div class="relative flex gap-2">
              <select onchange="updateUnplanned('${task.id}', 'status', this.value)" class="flex-1 appearance-none text-sm border-2 border-slate-200 px-3 py-2.5 focus:outline-none focus:border-amber-500 font-bold h-10 ${status.color} touch-manipulation">
                ${STATUS_OPTIONS.filter(o => o.value !== 'Без статуса').map(opt => `<option value="${opt.value}" class="bg-white text-slate-900" ${task.status === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
              <button onclick="removeUnplanned('${task.id}')" class="px-3 py-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 h-10 flex items-center justify-center touch-manipulation"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>
          <label class="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
              <input type="checkbox" onchange="toggleUnplannedFocus('${task.id}')" ${task.focus ? 'checked' : ''} class="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 touch-manipulation">
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
    <div class="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden">
        <div onclick="document.getElementById('${domId}').classList.toggle('hidden'); if(typeof lucide!=='undefined')lucide.createIcons();" class="p-3 cursor-pointer bg-white hover:bg-slate-50">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                    <div class="p-2 bg-slate-100 border border-slate-200 rounded shrink-0">
                        <i data-lucide="file-text" class="w-4 h-4 text-slate-500"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5 mb-0.5">
                            <span class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[70px]">${report.department}</span>
                            <span class="text-[10px] px-2 py-0.5 ${report.report_type === 'monthly' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-800 text-white'} rounded font-bold">${typeLabel}</span>
                        </div>
                        <div class="text-xs text-slate-500 font-mono">${report.period?.week_dates || '—'}</div>
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <div class="text-right">
                        <div class="text-xl font-bold ${percentClass}">${percent}%</div>
                        <div class="text-[9px] text-slate-400">${report.calculated_stats?.done || 0}/${report.calculated_stats?.total || 0}</div>
                    </div>
                </div>
            </div>
            <div class="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full ${percentBg} transition-all" style="width: ${percent}%"></div>
            </div>
        </div>
        <div id="${domId}" class="hidden border-t border-slate-100 bg-slate-50 p-3 space-y-3">
            ${report.tasks && report.tasks.length > 0 ? `
            <div>
                <div class="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
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
                        <span class="text-[9px] px-1.5 py-0.5 rounded border ${t.status === 'Выполнено' ? 'bg-green-50 text-green-600 border-green-200' : (t.status === 'Не выполнено' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200')}">${t.status}</span>
                    </div>
                    `).join('')}
                    ${report.tasks.length > 5 ? `<div class="text-xs text-slate-400 text-center py-1">...ещё ${report.tasks.length - 5}</div>` : ''}
                </div>
            </div>
            ` : ''}
            
            ${report.unplanned_tasks && report.unplanned_tasks.length > 0 ? `
            <div>
                <div class="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
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
                        <span class="text-[9px] px-1.5 py-0.5 rounded border ${t.status === 'Выполнено' ? 'bg-green-50 text-green-600 border-green-200' : (t.status === 'Не выполнено' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200')}">${t.status}</span>
                    </div>
                    `).join('')}
                    ${report.unplanned_tasks.length > 3 ? `<div class="text-xs text-slate-400 text-center py-1">...ещё ${report.unplanned_tasks.length - 3}</div>` : ''}
                </div>
            </div>
            ` : ''}
            
            <button onclick="editReport('${report.id}')" class="w-full py-2 text-xs font-bold uppercase text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:bg-indigo-50 rounded flex items-center justify-center gap-1">
                <i data-lucide="pencil" class="w-3 h-3"></i> Редактировать отчёт
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
    const defaultSheetNames = ['НП', 'ГИ', 'КД', 'РОП', 'РОМ', 'РОПР', 'РСО'];
    
    return `
    <div class="animate-fade-in pb-24">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-300">
            <div>
                <h1 class="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <i data-lucide="table" class="w-6 h-6 text-green-600"></i>
                    Отчеты по отделам
                </h1>
                <p class="text-xs text-slate-500 mt-0.5">${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="refreshAllDepartments()" class="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1">
                    <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                    Обновить все
                </button>
                <button onclick="navigate('select-dept')" class="text-xs font-bold uppercase text-slate-500 hover:text-slate-800 tracking-wide flex items-center gap-1">
                    <i data-lucide="arrow-left" class="w-3 h-3"></i> Назад
                </button>
            </div>
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
                        <button onclick="importDepartment()" class="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1">
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
                    <div id="departmentStats" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <!-- Статистика будет добавлена динамически -->
                    </div>
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
            document.getElementById('sheetsStatus').classList.remove('hidden');
            document.getElementById('connectedInfo').textContent = data.title || 'Таблица подключена';
            await loadAllDepartments();
        } else {
            alert('Ошибка: ' + data.error);
        }
    } catch (e) {
        alert('Ошибка: ' + e.message);
    }
};

window.loadAllDepartments = async () => {
    // Use encoded sheet names to avoid Unicode issues
    const sheetNames = ['НП', 'ГИ', 'КД', 'РОП', 'РОМ', 'РОПР', 'РСО'];
    
    try {
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
            
            renderDepartmentData(currentDepartment);
            document.getElementById('sheetsStatus').classList.remove('hidden');
            document.getElementById('connectedInfo').textContent = `Загружено ${Object.keys(departmentsData).length} отделов`;
        } else {
            alert('Ошибка загрузки: ' + data.error);
        }
    } catch (e) {
        alert('Ошибка: ' + e.message);
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
    renderDepartmentData(sheetName);
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
            renderDepartmentData(currentDepartment);
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
                weeks.push({ name: dateInfo.date, tasks: tasks });
                tasks.forEach(task => updateStats(task, stats));
            }
        }
    });

    // Sort weeks by date (newest first)
    const parseWeekDate = (dateStr) => {
        const parts = dateStr.match(/(\d{2})\.(\d{2})-(\d{2})\.(\d{2})\.(\d{2})/);
        if (parts) {
            const [, d1, m1, d2, m2, y] = parts;
            return new Date('20' + y, parseInt(m2) - 1, parseInt(d2));
        }
        return new Date(0);
    };

    weeks.sort((a, b) => parseWeekDate(b.name) - parseWeekDate(a.name));

    return { weeks, stats };
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
            // ["1", "", "Задача", "продукт", "результат", "комментарий"]
            return { task: row[2] || '', product: row[3] || '', comment: row[4] || '', status: row[5] || 'Без статуса' };
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

const renderDepartmentData = (department) => {
    const data = departmentsData[department] || { weeks: [], stats: { total: 0, completed: 0, inProgress: 0, notCompleted: 0 } };
    
    // Render stats
    const statsHtml = `
        <div class="text-center">
            <div class="text-2xl font-bold text-slate-900">${data.stats.total}</div>
            <div class="text-xs text-slate-500">Всего</div>
        </div>
        <div class="text-center">
            <div class="text-2xl font-bold text-green-600">${data.stats.completed}</div>
            <div class="text-xs text-slate-500">Выполнено</div>
        </div>
        <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">${data.stats.inProgress}</div>
            <div class="text-xs text-slate-500">В работе</div>
        </div>
        <div class="text-center">
            <div class="text-2xl font-bold text-red-600">${data.stats.notCompleted}</div>
            <div class="text-xs text-slate-500">Не выполнено</div>
        </div>
    `;
    
    document.getElementById('departmentStats').innerHTML = statsHtml;
    
    // Render table with weeks
    const container = document.getElementById('departmentTableBody');
    if (!data.weeks || data.weeks.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="px-3 py-8 text-center text-slate-400">Нет данных</td></tr>';
        return;
    }
    
    const html = data.weeks.map((week, weekIndex) => {
        const weekCompleted = week.tasks.filter(t => (t.status || '').toLowerCase().includes('выполн')).length;
        const weekTotal = week.tasks.length;
        const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

        return `
            <tr class="bg-slate-100">
                <td colspan="5" class="px-3 py-2">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-slate-800">${week.name}</span>
                        <span class="text-xs text-slate-500">${weekCompleted}/${weekTotal} (${weekPercent}%)</span>
                    </div>
                </td>
            </tr>
            ${week.tasks.map(task => `
                <tr class="hover:bg-slate-50 border-b border-slate-100">
                    <td class="px-3 py-2 text-slate-700 font-medium">${task.id}</td>
                    <td class="px-3 py-2 text-slate-900 font-medium">${task.task}</td>
                    <td class="px-3 py-2 text-slate-600 text-xs">${task.product || '-'}</td>
                    <td class="px-3 py-2 text-slate-500 text-xs">${task.comment || '-'}</td>
                    <td class="px-3 py-2">
                        <span class="px-2 py-0.5 rounded text-xs font-bold ${getStatusClass(task.status)}">${task.status}</span>
                    </td>
                </tr>
              `).join('')}
        `;
    }).join('');

    container.innerHTML = html;
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
    if (status?.toLowerCase().includes('выполн')) return 'bg-green-100 text-green-700';
    if (status?.toLowerCase().includes('работе')) return 'bg-blue-100 text-blue-700';
    if (status?.toLowerCase().includes('не выполн')) return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
};

// --- INIT ---
const init = async () => {
    state.view = 'sheets';
    setInterval(checkDeadline, 60000);
    checkDeadline();
    await loadAllDepartments();
    render();
};

document.addEventListener('DOMContentLoaded', init);
