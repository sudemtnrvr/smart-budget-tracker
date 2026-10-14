function updateDashboard() {
    let currentUserId = null;
    if (DB.currentUser && DB.currentUser.id) {
        currentUserId = DB.currentUser.id;
    }
    
    const realToday = new Date();
    const realTodayStr = realToday.toISOString().split('T')[0];
    
    const now = getToday();
    const todayStr = now.toISOString().split('T')[0];
    
    const storedTestDate = localStorage.getItem('lifeWalletTestDate');
    let testDateValue = null;
    if (typeof window !== 'undefined' && window.testDateOverride) {
        testDateValue = window.testDateOverride;
    } else if (typeof testDateOverride !== 'undefined' && testDateOverride !== null) {
        testDateValue = testDateOverride;
    } else {
        testDateValue = storedTestDate;
    }
    
    let filterDate = realTodayStr;
    if (testDateValue) {
        filterDate = new Date(testDateValue).toISOString().split('T')[0];
    }
    
    const userTransactions = [];
    for (let i = 0; i < DB.transactions.length; i++) {
        const transaction = DB.transactions[i];
        if (transaction.userId === currentUserId && transaction.date <= filterDate) {
            userTransactions.push(transaction);
        }
    }
    
    let income = 0;
    for (let i = 0; i < userTransactions.length; i++) {
        const transaction = userTransactions[i];
        if (transaction.type === 'income') {
            income = income + transaction.amount;
        }
    }
    
    let expense = 0;
    for (let i = 0; i < userTransactions.length; i++) {
        const transaction = userTransactions[i];
        if (transaction.type === 'expense') {
            expense = expense + transaction.amount;
        }
    }
    
    console.log('Dashboard güncelleniyor - filterDate:', filterDate, 'income:', income, 'expense:', expense);
    console.log('Gelir işlemleri:', userTransactions.filter(t => t.type === 'income'));
    
    document.getElementById('total-income').innerText = `+${income} ₺`;
    document.getElementById('total-expense').innerText = `-${expense} ₺`;

    const net = income - expense;
    const netEl = document.getElementById('net-amount');
    if (netEl) {
        let netText = '';
        if (net >= 0) {
            netText = '+' + net + ' ₺';
            netEl.classList.add('accent-yellow');
            netEl.classList.remove('text-gray-400');
        } else {
            netText = net + ' ₺';
            netEl.classList.remove('accent-yellow');
            netEl.classList.add('text-gray-400');
        }
        netEl.innerText = netText;
    }
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); 

    let todaySpent = 0, weekSpent = 0, monthSpent = 0;

    const storedTestDateForSpending = localStorage.getItem('lifeWalletTestDate');
    let testDateValueForSpending = null;
    if (typeof window !== 'undefined' && window.testDateOverride) {
        testDateValueForSpending = window.testDateOverride;
    } else if (typeof testDateOverride !== 'undefined' && testDateOverride !== null) {
        testDateValueForSpending = testDateOverride;
    } else {
        testDateValueForSpending = storedTestDateForSpending;
    }
    
    let filterDateForSpending = realTodayStr;
    if (testDateValueForSpending) {
        filterDateForSpending = new Date(testDateValueForSpending).toISOString().split('T')[0];
    }
    
    for (let i = 0; i < DB.transactions.length; i++) {
        const transaction = DB.transactions[i];
        if (transaction.type === 'expense' && 
            transaction.userId === currentUserId && 
            transaction.date <= filterDateForSpending) {
            
            const transactionDate = new Date(transaction.date);
            const transactionDateStr = transaction.date.split('T')[0];

            if (transactionDateStr === todayStr) {
                todaySpent = todaySpent + transaction.amount;
            }
            if (transactionDate >= firstDayOfWeek) {
                weekSpent = weekSpent + transaction.amount;
            }
            if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                monthSpent = monthSpent + transaction.amount;
            }
        }
    }

    document.getElementById('spent-today').innerText = `${todaySpent} ₺`;
    document.getElementById('spent-week').innerText = `${weekSpent} ₺`;
    document.getElementById('spent-month').innerText = `${monthSpent} ₺`;

    renderChart();

    checkRemindersAlert();

    renderRecurringExpenses();
}

function renderChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    let currentUserId = null;
    if (DB.currentUser && DB.currentUser.id) {
        currentUserId = DB.currentUser.id;
    }
    
    const catTotals = {};
    for (let i = 0; i < CATEGORIES.length; i++) {
        const category = CATEGORIES[i];
        catTotals[category.name] = 0;
    }

    // Test modunda ise test tarihine kadar, normal modda ise bugüne kadar olan giderleri hesapla
    const realTodayForChart = new Date();
    const realTodayStrForChart = realTodayForChart.toISOString().split('T')[0];
    const storedTestDateForChart = localStorage.getItem('lifeWalletTestDate');
    let testDateValueForChart = null;
    if (typeof window !== 'undefined' && window.testDateOverride) {
        testDateValueForChart = window.testDateOverride;
    } else if (typeof testDateOverride !== 'undefined' && testDateOverride !== null) {
        testDateValueForChart = testDateOverride;
    } else {
        testDateValueForChart = storedTestDateForChart;
    }
    
    let filterDateForChart = realTodayStrForChart;
    if (testDateValueForChart) {
        filterDateForChart = new Date(testDateValueForChart).toISOString().split('T')[0];
    }
    
    for (let i = 0; i < DB.transactions.length; i++) {
        const transaction = DB.transactions[i];
        if (transaction.type === 'expense' && 
            transaction.userId === currentUserId && 
            transaction.date <= filterDateForChart) {
            
            let categoryName = 'Diğer';
            for (let j = 0; j < CATEGORIES.length; j++) {
                const category = CATEGORIES[j];
                if (category.id === transaction.category) {
                    categoryName = category.name;
                    break;
                }
            }
            if (categoryName === 'Diğer' && transaction.category) {
                categoryName = transaction.category;
            }
            
            if (catTotals[categoryName]) {
                catTotals[categoryName] = catTotals[categoryName] + transaction.amount;
            } else {
                catTotals[categoryName] = transaction.amount;
            }
        }
    }

    const labels = [];
    for (let categoryName in catTotals) {
        if (catTotals[categoryName] > 0) {
            labels.push(categoryName);
        }
    }
    
    const data = [];
    for (let i = 0; i < labels.length; i++) {
        const categoryName = labels[i];
        data.push(catTotals[categoryName]);
    }
    
    const colors = [];
    for (let i = 0; i < labels.length; i++) {
        const labelName = labels[i];
        let categoryColor = '#ccc';
        for (let j = 0; j < CATEGORIES.length; j++) {
            const category = CATEGORIES[j];
            if (category.name === labelName) {
                categoryColor = category.color;
                break;
            }
        }
        colors.push(categoryColor);
    }

    let total = 0;
    for (let i = 0; i < data.length; i++) {
        total = total + data[i];
    }
    if (total === 0) {
        total = 1;
    }
    
    const percentLabels = [];
    for (let i = 0; i < labels.length; i++) {
        const labelName = labels[i];
        const percentage = (data[i] / total) * 100;
        let rounded = 0;
        if (percentage >= 1) {
            rounded = Math.round(percentage);
        } else {
            rounded = Number(percentage.toFixed(1));
        }
        percentLabels.push(labelName + ' (' + rounded + '%)');
    }

    if (data.length > 0) {
        const maxVal = Math.max(...data);
        const maxIdx = data.indexOf(maxVal);
        const maxCat = labels[maxIdx];
        const maxPct = Math.round((maxVal / total) * 100);
        document.getElementById('top-category-msg').innerHTML = `En çok <span class="text-white font-bold">${maxCat}</span> kategorisine harcama yapıyorsun (${maxPct}%).`;
    }

    if (expenseChartInstance) expenseChartInstance.destroy();

    expenseChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: percentLabels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: 'white', font: { size: 10 } } }
            }
        }
    });
}

function processRecurringTemplates() {
    const today = getToday();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let changed = false;

    let currentUserId = null;
    if (DB.currentUser && DB.currentUser.id) {
        currentUserId = DB.currentUser.id;
    }
    if (currentUserId && DB.userSalaries[currentUserId]) {
        const userSalary = DB.userSalaries[currentUserId];
        
        if (userSalary.amount && userSalary.day && !userSalary.skipped) {
            let lastAddedMonth = null;
            if (userSalary.lastAddedDate) {
                const lastParts = userSalary.lastAddedDate.split('-');
                lastAddedMonth = `${lastParts[0]}-${lastParts[1]}`;
            }
            const currentMonthStr = `${String(currentYear).padStart(4, '0')}-${String(currentMonth + 1).padStart(2, '0')}`;

            if (lastAddedMonth !== currentMonthStr) {
                const salaryDay = Math.min(userSalary.day, new Date(currentYear, currentMonth + 1, 0).getDate());
                const salaryDate = new Date(currentYear, currentMonth, salaryDay);

                let shouldAdd = true;
                if (userSalary.startDate) {
                    const startDate = new Date(userSalary.startDate);
                    if (salaryDate < startDate) {
                        shouldAdd = false;
                    }
                }

                if (shouldAdd && salaryDate <= today) {
                    const dateStr = salaryDate.toISOString().split('T')[0];
                    
                    let salaryExists = false;
                    for (let i = 0; i < DB.transactions.length; i++) {
                        const transaction = DB.transactions[i];
                        if (transaction.type === 'income' && 
                            transaction.desc === 'Maaş' && 
                            transaction.date.startsWith(currentMonthStr) &&
                            transaction.userId === currentUserId) {
                            salaryExists = true;
                            break;
                        }
                    }

                    if (!salaryExists) {
                        const storedTestDate = localStorage.getItem('lifeWalletTestDate');
                        const isTestMode = (typeof window !== 'undefined' && window.testDateOverride) || 
                                          (typeof testDateOverride !== 'undefined' && testDateOverride !== null) ||
                                          (storedTestDate !== null);
                        
                        const tx = {
                            id: Date.now() + Math.floor(Math.random() * 1000),
                            type: 'income',
                            amount: userSalary.amount,
                            category: 'salary',
                            desc: 'Maaş',
                            date: dateStr,
                            userId: currentUserId,
                            isTestTransaction: isTestMode
                        };
                        DB.transactions.unshift(tx);
                        changed = true;
                        
                        if (isTestMode) {
                            console.log('Test maaş işlemi oluşturuldu (isTestTransaction: true):', tx);
                        } else {
                            console.log('Normal maaş işlemi oluşturuldu:', tx);
                    }
                }

                    DB.userSalaries[currentUserId].lastAddedDate = currentMonthStr + '-01';
                }
            }
        }
    }
    
    if (changed) {
        saveData();
        updateDashboard();
        renderTransactions();
    }

    for (let i = 0; i < DB.recurringTemplates.length; i++) {
        const template = DB.recurringTemplates[i];
        let last = null;
        if (template.lastAddedDate) {
            last = new Date(template.lastAddedDate);
        } else {
            if (template.startDate) {
                last = new Date(template.startDate);
            } else {
                last = new Date();
            }
        }
        if (last > today) {
            continue;
        }

        let next = null;
        if (template.recurrenceType === 'weekly') {
            next = addWeeks(last, template.interval || 1);
        } else {
            next = addMonths(last, template.interval || 1);
            if (typeof template.day === 'number') {
                const desiredDay = template.day;
                next = new Date(next.getFullYear(), next.getMonth(), Math.min(desiredDay, new Date(next.getFullYear(), next.getMonth()+1, 0).getDate()));
            }
        }

        while (next && next <= today) {
            const dateStr = next.toISOString().split('T')[0];
            let transactionType = 'expense';
            if (template.type) {
                transactionType = template.type;
            }
            
            let transactionCategory = 'other';
            if (template.category) {
                transactionCategory = template.category;
            }
            
            let transactionDesc = 'Tekrarlayan Gider';
            if (template.desc) {
                transactionDesc = template.desc;
            } else if (template.name) {
                transactionDesc = template.name;
            }
            
            let transactionUserId = null;
            if (DB.currentUser && DB.currentUser.id) {
                transactionUserId = DB.currentUser.id;
            }
            
            const tx = {
                id: Date.now() + Math.floor(Math.random()*1000),
                type: transactionType,
                amount: template.amount,
                category: transactionCategory,
                desc: transactionDesc,
                date: dateStr,
                sourceTemplateId: template.id,
                userId: transactionUserId
            };
            DB.transactions.unshift(tx);
            template.lastAddedDate = dateStr;
            changed = true;

            let interval = 1;
            if (template.interval) {
                interval = template.interval;
            }
            if (template.recurrenceType === 'weekly') {
                next = addWeeks(next, interval);
            } else {
                next = addMonths(next, interval);
            }
        }
    }

    if (changed) saveData();
}

function renderRecurringExpenses() {
    const container = document.getElementById('recurring-expenses-list');
    if (!container) return;

    let currentUserId = null;
    if (DB.currentUser && DB.currentUser.id) {
        currentUserId = DB.currentUser.id;
    }
    if (!currentUserId) {
        container.innerHTML = '<p class="text-center text-gray-400 py-4">Giriş yapılmamış</p>';
        return;
    }

    const recurringReminders = [];
    for (let i = 0; i < DB.reminders.length; i++) {
        const reminder = DB.reminders[i];
        if (reminder.userId === currentUserId && reminder.isRecurring === true) {
            recurringReminders.push(reminder);
        }
    }

    if (recurringReminders.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-4 text-sm">Henüz düzenli harcama yok</p>';
        return;
    }

    for (let i = 0; i < recurringReminders.length - 1; i++) {
        for (let j = i + 1; j < recurringReminders.length; j++) {
            const dateA = new Date(recurringReminders[i].date);
            const dateB = new Date(recurringReminders[j].date);
            if (dateA > dateB) {
                const temp = recurringReminders[i];
                recurringReminders[i] = recurringReminders[j];
                recurringReminders[j] = temp;
            }
        }
    }

    let htmlContent = '';
    for (let i = 0; i < recurringReminders.length; i++) {
        const reminder = recurringReminders[i];
        const reminderDate = new Date(reminder.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((reminderDate - today) / (1000 * 60 * 60 * 24));
        
        let dateText = '';
        let dateClass = 'text-gray-400';
        if (daysUntil < 0) {
            dateText = 'Geçmiş';
            dateClass = 'text-gray-500';
        } else if (daysUntil === 0) {
            dateText = 'Bugün';
            dateClass = 'accent-yellow';
        } else if (daysUntil <= 3) {
            dateText = `${daysUntil} gün sonra`;
            dateClass = 'accent-yellow';
        } else {
            dateText = reminderDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
        }

        htmlContent = htmlContent + `
            <div class="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div class="flex-1">
                    <p class="font-medium text-sm">${reminder.title}</p>
                    <p class="text-xs ${dateClass} mt-1">${dateText}</p>
                </div>
                <button onclick="deleteRecurringExpense(${reminder.id})" class="text-gray-400 hover:text-gray-300 p-2 rounded-lg hover:bg-gray-500/10 transition-all ml-2" title="Düzenli ödemeyi kaldır">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;
    }
    container.innerHTML = htmlContent;

    lucide.createIcons();
}

function deleteRecurringExpense(reminderId) {
    if (!confirm('Bu düzenli ödemeyi kaldırmak istediğinizden emin misiniz?')) return;
    
    const newReminders = [];
    for (let i = 0; i < DB.reminders.length; i++) {
        const reminder = DB.reminders[i];
        if (reminder.id !== reminderId) {
            newReminders.push(reminder);
        }
    }
    DB.reminders = newReminders;
    saveData();
    renderRecurringExpenses();
    renderReminders();
}

