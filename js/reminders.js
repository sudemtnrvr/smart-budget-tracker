function addReminder() {
    const title = document.getElementById('remind-title').value;
    const date = document.getElementById('remind-date').value;
    
    if(!title || !date) return alert("Tarih ve Başlık girin");

    DB.reminders.push({ 
        id: Date.now(), 
        title, 
        date,
        userId: DB.currentUser?.id || null
    });
    saveData();
    document.getElementById('remind-title').value = '';
    document.getElementById('remind-date').value = '';
    renderReminders();
}

function renderReminders() {
    const list = document.getElementById('reminder-list');
    list.innerHTML = DB.reminders.sort((a,b) => new Date(a.date) - new Date(b.date)).map(r => `
        <li class="glass p-3 rounded-xl flex justify-between items-center border-l-4 border-accent-yellow">
            <div>
                <p class="font-bold text-sm">${r.title}</p>
                <p class="text-xs text-gray-400">Tarih: ${r.date}</p>
            </div>
            <button onclick="deleteReminder(${r.id})" class="text-gray-400 hover:text-gray-300">
                <i data-lucide="trash-2" width="16"></i>
            </button>
        </li>
    `).join('');
    lucide.createIcons();
}

function deleteReminder(id) {
    DB.reminders = DB.reminders.filter(r => r.id !== id);
    saveData();
    renderReminders();
}

function checkRemindersAlert() {
    const alertArea = document.getElementById('reminder-alert-area');
    alertArea.innerHTML = '';
    alertArea.classList.add('hidden');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (DB.reminderAlertDismissed === todayStr) return;

    let hasAlert = false;

    DB.reminders.forEach(r => {
        const due = new Date(r.date);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays >= 0 && diffDays <= 3) {
            hasAlert = true;
            alertArea.classList.remove('hidden');
            alertArea.innerHTML += `
                <div class="bg-yellow-500/20 border border-yellow-500 text-yellow-200 p-3 rounded-xl flex items-center gap-3 mb-2">
                    <i data-lucide="alert-triangle"></i>
                    <div class="flex-1">
                        <p class="font-bold text-sm">Yaklaşan Ödeme: ${r.title}</p>
                        <p class="text-xs">${diffDays === 0 ? 'BUGÜN!' : diffDays + ' gün kaldı.'}</p>
                    </div>
                </div>
            `;
        }
    });

    if (hasAlert) {
        alertArea.classList.remove('hidden');
        alertArea.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                    ${alertArea.innerHTML}
                </div>
                <button onclick="dismissReminderAlerts()" class="ml-3 text-yellow-200 hover:text-yellow-100 p-2 rounded-lg hover:bg-yellow-500/20 transition-all">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
        `;
    }
    lucide.createIcons();
}

function dismissReminderAlerts() {
    const todayStr = new Date().toISOString().split('T')[0];
    DB.reminderAlertDismissed = todayStr;
    saveData();
    document.getElementById('reminder-alert-area').classList.add('hidden');
}

