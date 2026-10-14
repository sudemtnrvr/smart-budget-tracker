function renderCategories() {
}

function addTransaction() {
    const amountRaw = document.getElementById('trans-amount').value;
    const amount = parseFloat(String(amountRaw).replace(',', '.'));
    const desc = document.getElementById('trans-desc').value;
    const today = new Date();
    const date = today.toISOString().split('T')[0];
    
    let category = 'income';
    if (currentTransType === 'expense') {
        const descLower = desc.toLowerCase();
        let matchedCategory = null;
        for (let i = 0; i < CATEGORIES.length; i++) {
            const categoryItem = CATEGORIES[i];
            if (descLower.includes(categoryItem.name.toLowerCase()) || 
                descLower.includes(categoryItem.id)) {
                matchedCategory = categoryItem;
                break;
            }
        }
        if (matchedCategory) {
            category = matchedCategory.id;
        } else {
            category = 'other';
        }
    }

    if (!amount || isNaN(amount) || !desc) return alert("Eksik bilgi!");

    let transactionUserId = null;
    if (DB.currentUser && DB.currentUser.id) {
        transactionUserId = DB.currentUser.id;
    }
    
    const tx = {
        id: Date.now(),
        type: currentTransType,
        amount: amount,
        category: category,
        desc: desc,
        date: date,
        userId: transactionUserId
    };

    DB.transactions.unshift(tx);

    try {
        if (currentTransType === 'expense') {
            const recurringCheckbox = document.getElementById('trans-recurring');
            let recurring = false;
            if (recurringCheckbox && recurringCheckbox.checked) {
                recurring = true;
            }
            if (recurring && date) {
                const selectedDate = new Date(date);
                const day = selectedDate.getDate();
                
                const nextMonth = new Date(selectedDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                
                const lastDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
                const reminderDay = Math.min(day, lastDayOfNextMonth);
                
                const reminderDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), reminderDay);
                const reminderDateStr = reminderDate.toISOString().split('T')[0];
                
                let reminderUserId = null;
                if (DB.currentUser && DB.currentUser.id) {
                    reminderUserId = DB.currentUser.id;
                }
                
                const reminder = {
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    title: desc + ' (' + amount + ' ₺)',
                    date: reminderDateStr,
                    userId: reminderUserId,
                    isRecurring: true,
                    originalDate: date,
                    originalAmount: amount
                };
                DB.reminders.push(reminder);
            }
        }
    } catch(e) { console.error(e); }

    saveData();
    
    document.getElementById('trans-amount').value = '';
    document.getElementById('trans-desc').value = '';
    document.getElementById('trans-recurring').checked = false;
    renderTransactions();
    renderReminders(); // Hatırlatıcıları da güncelle
    alert("Kaydedildi!");
}

function renderTransactions() {
    const list = document.getElementById('transaction-list');
    let currentUserId = null;
    if (DB.currentUser && DB.currentUser.id) {
        currentUserId = DB.currentUser.id;
    }
    
    const realToday = new Date();
    const realTodayStr = realToday.toISOString().split('T')[0];
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
    
    const maxTransactions = 10;
    const transactionsToShow = [];
    for (let i = 0; i < userTransactions.length && i < maxTransactions; i++) {
        transactionsToShow.push(userTransactions[i]);
    }
    
    let htmlContent = '';
    for (let i = 0; i < transactionsToShow.length; i++) {
        const transaction = transactionsToShow[i];
        const isExpense = transaction.type === 'expense';
        
        let color = 'accent-yellow';
        if (isExpense) {
            color = 'text-gray-400';
        }
        
        let sign = '+';
        if (isExpense) {
            sign = '-';
        }
        
        let categoryName = 'Gelir';
        for (let j = 0; j < CATEGORIES.length; j++) {
            const category = CATEGORIES[j];
            if (category.id === transaction.category) {
                categoryName = category.name;
                break;
            }
        }
        
        let barColor = 'bg-accent-yellow';
        if (isExpense) {
            barColor = 'bg-gray-500';
        }
        
        htmlContent = htmlContent + `
        <li class="glass p-3 rounded-xl flex justify-between items-center">
            <div class="flex items-center gap-3">
                <div class="w-2 h-8 rounded-full ${barColor}"></div>
                <div>
                    <p class="font-bold text-sm">${transaction.desc}</p>
                    <p class="text-xs text-gray-400">${transaction.date} • ${categoryName}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="font-mono font-bold ${color}">${sign}${transaction.amount} ₺</span>
                <button onclick="deleteTransaction(${transaction.id})" class="text-gray-400 hover:text-gray-300 ml-2 p-2 rounded-md">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </li>`;
    }
    list.innerHTML = htmlContent;
    lucide.createIcons();
}

function deleteTransaction(id) {
    if (!confirm('Bu işlemi silmek istiyor musunuz?')) {
        return;
    }
    
    const newTransactions = [];
    for (let i = 0; i < DB.transactions.length; i++) {
        const transaction = DB.transactions[i];
        if (transaction.id !== id) {
            newTransactions.push(transaction);
        }
    }
    DB.transactions = newTransactions;
    
    saveData();
    renderTransactions();
    updateDashboard();
}

function setTransType(type) {
    currentTransType = type;
    const btnExpense = document.getElementById('btn-type-expense');
    const btnIncome = document.getElementById('btn-type-income');
    const recurringWrapper = document.getElementById('recurring-wrapper');

    if (type === 'expense') {
        btnExpense.classList.add('bg-gray-600', 'text-white');
        btnExpense.classList.remove('text-gray-400');
        btnIncome.classList.remove('bg-accent-yellow', 'text-black');
        btnIncome.classList.add('text-gray-400');
        if (recurringWrapper) recurringWrapper.classList.remove('hidden');
    } else {
        btnIncome.classList.add('bg-accent-yellow', 'text-black');
        btnIncome.classList.remove('text-gray-400');
        btnExpense.classList.remove('bg-gray-600', 'text-white');
        btnExpense.classList.add('text-gray-400');
        if (recurringWrapper) recurringWrapper.classList.add('hidden');
    }
}

function switchTab(tabId) {
    const allTabs = document.querySelectorAll('.tab-content');
    for (let i = 0; i < allTabs.length; i++) {
        allTabs[i].classList.remove('active');
    }
    
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    const mobileDropdown = document.getElementById('mobile-dropdown');
    if (mobileDropdown && !mobileDropdown.classList.contains('hidden')) {
        if (typeof toggleMobileMenu === 'function') {
            toggleMobileMenu();
        }
    }

    if(tabId === 'dashboard') {
        updateDashboard();
    }
    
    if(tabId === 'transactions') {
        setTransType(currentTransType);
    }
}

