function renderUsersList() {
    const container = document.getElementById('users-list-container');
    if (!container) return;

    if (!DB.currentUser) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Giriş yapılmamış</p>';
        return;
    }

    const user = DB.users.find(u => u.id === DB.currentUser.id);
    if (!user) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Kullanıcı bulunamadı</p>';
        return;
    }

    const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor';
    const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('tr-TR') : 'Hiç giriş yapmamış';
    
    const userTransactions = DB.transactions.filter(t => {
        return t.userId === user.id;
    });
    const userLists = DB.shoppingLists.filter(l => {
        return l.userId === user.id;
    });
    const userReminders = DB.reminders.filter(r => {
        return r.userId === user.id;
    });

    const userIncome = userTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const userExpense = userTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const userNet = userIncome - userExpense;

    container.innerHTML = `
        <div class="bg-slate-800/50 p-4 rounded-xl border-2 border-accent-yellow mb-3">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h4 class="font-bold text-lg accent-yellow">
                        ${user.name} (Aktif)
                    </h4>
                    <p class="text-sm text-gray-400">${user.email}</p>
                </div>
                <div class="flex gap-2 items-center">
                    <button onclick="resetUserData(${user.id})" class="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1 rounded-lg" title="Tüm Verileri Sıfırla">
                        Sıfırla
                    </button>
                    <span class="bg-accent-yellow text-black text-xs px-2 py-1 rounded">Aktif</span>
                </div>
            </div>
            
            <div class="mt-3 space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-400">Kayıt Tarihi:</span>
                    <span class="text-gray-300">${createdAt}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">Son Giriş:</span>
                    <span class="text-gray-300">${lastLogin}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">İşlem Sayısı:</span>
                    <span class="text-gray-300">${userTransactions.length} adet</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">Liste Sayısı:</span>
                    <span class="text-gray-300">${userLists.length} adet</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">Hatırlatıcı:</span>
                    <span class="text-gray-300">${userReminders.length} adet</span>
                </div>
            </div>
        </div>
        
        <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 class="font-bold mb-3 text-white">Finansal Özet</h4>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-400">Toplam Gelir:</span>
                    <span class="accent-yellow font-bold">+${userIncome.toFixed(2)} ₺</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">Toplam Gider:</span>
                    <span class="text-gray-400 font-bold">-${userExpense.toFixed(2)} ₺</span>
                </div>
                <div class="flex justify-between border-t border-gray-700 pt-2">
                    <span class="text-gray-400">Net Varlık:</span>
                    <span class="font-bold ${userNet >= 0 ? 'accent-yellow' : 'text-gray-400'}">
                        ${userNet >= 0 ? '+' : ''}${userNet.toFixed(2)} ₺
                    </span>
                </div>
            </div>
        </div>
    `;
}

function renderSalaryManagement() {
    const container = document.getElementById('salary-management-section');
    if (!container) return;

    const currentUserId = DB.currentUser?.id;
    if (!currentUserId) {
        container.innerHTML = '<p class="text-center text-gray-400 py-4">Giriş yapılmamış</p>';
        return;
    }

    const userSalary = DB.userSalaries[currentUserId];

    if (!userSalary || userSalary.skipped) {
        container.innerHTML = `
            <div class="bg-slate-800/50 p-4 rounded-xl">
                <p class="text-sm text-gray-400 mb-3">Henüz aylık net gelir ayarlanmamış</p>
                <button onclick="openSalarySetupModal()" class="w-full modern-btn-yellow font-bold py-3 rounded-xl">
                    Maaş Ayarla
                </button>
            </div>
        `;
        return;
    }

    const salaryDate = userSalary.startDate ? new Date(userSalary.startDate) : null;
    const salaryDay = userSalary.day;
    const salaryAmount = userSalary.amount;
    const salaryDateStr = salaryDate ? salaryDate.toLocaleDateString('tr-TR') : 'Bilinmiyor';

    container.innerHTML = `
        <div class="bg-slate-800/50 p-4 rounded-xl mb-3">
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-400">Aylık Net Gelir:</span>
                    <span class="accent-yellow font-bold">${salaryAmount.toFixed(2)} ₺</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">Ödeme Günü:</span>
                    <span class="text-gray-300">Her ayın ${salaryDay}. günü</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">Başlangıç Tarihi:</span>
                    <span class="text-gray-300">${salaryDateStr}</span>
                </div>
            </div>
        </div>
        <button onclick="openSalaryUpdateModal()" class="w-full modern-btn-yellow font-bold py-3 rounded-xl">
            Maaşı Güncelle
        </button>
    `;
}

function openSalaryUpdateModal() {
    const currentUserId = DB.currentUser?.id;
    if (!currentUserId) return;

    const userSalary = DB.userSalaries[currentUserId];
    if (!userSalary || userSalary.skipped) {
        openSalarySetupModal();
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'salary-update-modal';
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="glass rounded-2xl p-6 max-w-md w-full">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">Aylık Net Gelir Güncelle</h3>
                <button onclick="closeSalaryUpdateModal()" class="text-gray-400 hover:text-white">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="text-sm text-gray-400 mb-2 block">Aylık Net Gelir (₺)</label>
                    <input type="text" inputmode="decimal" id="update-salary-amount" placeholder="Aylık Net Gelir (₺)" 
                           value="${userSalary.amount}" 
                           class="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white">
                </div>
                
                <div>
                    <label class="text-sm text-gray-400 mb-2 block">Ödeme Tarihi</label>
                    <input type="date" id="update-salary-date" 
                           value="${userSalary.startDate || ''}" 
                           class="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white">
                    <p class="text-xs text-gray-400 mt-1">Her ayın bu tarihinde maaş eklenecek</p>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="updateSalary()" class="flex-1 modern-btn-yellow font-bold py-3 rounded-xl">
                        Güncelle
                    </button>
                    <button onclick="closeSalaryUpdateModal()" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">
                        İptal
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    lucide.createIcons();
}

function openSalarySetupModal() {
    const modal = document.createElement('div');
    modal.id = 'salary-setup-modal';
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="glass rounded-2xl p-6 max-w-md w-full">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">Aylık Net Gelir Ayarla</h3>
                <button onclick="closeSalarySetupModal()" class="text-gray-400 hover:text-white">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="text-sm text-gray-400 mb-2 block">Aylık Net Gelir (₺)</label>
                    <input type="text" inputmode="decimal" id="setup-salary-amount-modal" placeholder="Aylık Net Gelir (₺)" 
                           class="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white">
                </div>
                
                <div>
                    <label class="text-sm text-gray-400 mb-2 block">Ödeme Tarihi</label>
                    <input type="date" id="setup-salary-date-modal" 
                           class="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white">
                    <p class="text-xs text-gray-400 mt-1">Her ayın bu tarihinde maaş eklenecek</p>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="saveSalaryFromModal()" class="flex-1 modern-btn-yellow font-bold py-3 rounded-xl">
                        Kaydet
                    </button>
                    <button onclick="closeSalarySetupModal()" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">
                        İptal
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    lucide.createIcons();
}

function closeSalaryUpdateModal() {
    const modal = document.getElementById('salary-update-modal');
    if (modal) {
        modal.remove();
    }
}

function closeSalarySetupModal() {
    const modal = document.getElementById('salary-setup-modal');
    if (modal) {
        modal.remove();
    }
}

// Modal'dan maaş kaydet (ilk kez ayarlama)
function saveSalaryFromModal() {
    const amount = parseFloat(String(document.getElementById('setup-salary-amount-modal').value).replace(',', '.'));
    const salaryDateInput = document.getElementById('setup-salary-date-modal').value;

    if (!amount || isNaN(amount) || amount <= 0) {
        alert('Geçerli bir tutar girin');
        return;
    }
    if (!salaryDateInput) {
        alert('Bir tarih seçin');
        return;
    }

    if (!DB.currentUser) {
        alert('Lütfen önce giriş yapın!');
        return;
    }

    const selectedDate = new Date(salaryDateInput);
    const day = selectedDate.getDate();

    DB.userSalaries[DB.currentUser.id] = {
        amount: amount,
        day: day,
        startDate: salaryDateInput,
        lastAddedDate: null,
        skipped: false
    };

    saveData();
    closeSalarySetupModal();
    renderSalaryManagement();
    
    updateDashboard();
    
    alert('Maaş başarıyla ayarlandı!');
}

function updateSalary() {
    const amount = parseFloat(String(document.getElementById('update-salary-amount').value).replace(',', '.'));
    const salaryDateInput = document.getElementById('update-salary-date').value;

    if (!amount || isNaN(amount) || amount <= 0) {
        alert('Geçerli bir tutar girin');
        return;
    }
    if (!salaryDateInput) {
        alert('Bir tarih seçin');
        return;
    }

    if (!DB.currentUser) {
        alert('Lütfen önce giriş yapın!');
        return;
    }

    const currentUserId = DB.currentUser.id;
    const selectedDate = new Date(salaryDateInput);
    const day = selectedDate.getDate();

    DB.userSalaries[currentUserId] = {
        amount: amount,
        day: day,
        startDate: salaryDateInput,
        lastAddedDate: DB.userSalaries[currentUserId]?.lastAddedDate || null,
        skipped: false
    };

    saveData();
    closeSalaryUpdateModal();
    renderSalaryManagement();
    
    updateDashboard();
    
    alert('Maaş başarıyla güncellendi!');
}

function updateApiKeyDisplay() {
    const displayElement = document.getElementById('current-api-key-display');
    const buttonElement = document.getElementById('api-key-button');
    
    if (displayElement) {
        const apiKey = getCurrentUserApiKey();
        if (apiKey) {
            displayElement.textContent = '••••••••' + apiKey.slice(-8);
        } else {
            displayElement.textContent = 'Henüz API key kaydedilmedi';
        }
    }
    
    if (buttonElement) {
        const apiKey = getCurrentUserApiKey();
        buttonElement.textContent = apiKey ? 'API Key Güncelle' : 'API Key Ekle';
    }
}

// Kullanıcı verilerini sıfırla
function resetUserData(userId) {
    if (!confirm('Bu kullanıcının TÜM verilerini sıfırlamak istediğinizden emin misiniz?\n\nBu işlem şunları silecek:\n• Tüm işlemler\n• Tüm alışveriş listeleri\n• Tüm hatırlatıcılar\n• API Key\n• Maaş ayarları\n\nBu işlem geri alınamaz!')) {
        return;
    }

    DB.transactions = DB.transactions.filter(t => t.userId !== userId);
    DB.shoppingLists = DB.shoppingLists.filter(l => l.userId !== userId);
    DB.reminders = DB.reminders.filter(r => r.userId !== userId);
    
    if (DB.userApiKeys[userId]) {
        delete DB.userApiKeys[userId];
    }
    
    if (DB.userSalaries[userId]) {
        delete DB.userSalaries[userId];
    }
    
    DB.recurringTemplates = DB.recurringTemplates.filter(t => t.userId !== userId);
    
    saveData();
    
    if (DB.currentUser && DB.currentUser.id === userId) {
        updateDashboard();
        renderTransactions();
        renderShoppingLists();
        renderReminders();
    }
    
    renderUsersList();
    
    alert('Kullanıcı verileri başarıyla sıfırlandı!');
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('light-mode');
    
    if (isDark) {
        body.classList.remove('light-mode');
        localStorage.setItem('lifeWalletTheme', 'dark');
        updateThemeIcon('moon');
    } else {
        body.classList.add('light-mode');
        localStorage.setItem('lifeWalletTheme', 'light');
        updateThemeIcon('sun');
    }
}

function updateThemeIcon(iconName) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5"></i>`;
        lucide.createIcons();
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('lifeWalletTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        updateThemeIcon('sun');
    } else {
        document.body.classList.remove('light-mode');
        updateThemeIcon('moon');
    }
}

function showAllUsersModal() {
    const modal = document.createElement('div');
    modal.id = 'all-users-modal';
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    
    const allUsers = DB.users || [];
    const totalTransactions = DB.transactions?.length || 0;
    const totalLists = DB.shoppingLists?.length || 0;
    const totalReminders = DB.reminders?.length || 0;
    
    const usersWithStats = allUsers.map(user => {
        const userTransactions = DB.transactions?.filter(t => t.userId === user.id) || [];
        const userLists = DB.shoppingLists?.filter(l => l.userId === user.id) || [];
        const userReminders = DB.reminders?.filter(r => r.userId === user.id) || [];
        const userSalary = DB.userSalaries?.[user.id];
        
        return {
            ...user,
            transactionCount: userTransactions.length,
            listCount: userLists.length,
            reminderCount: userReminders.length,
            hasSalary: userSalary && !userSalary.skipped,
            salaryAmount: userSalary?.amount || 0
        };
    });
    
    modal.innerHTML = `
        <div class="glass rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-2xl font-bold text-yellow-400">Tüm Kayıtlı Kullanıcılar</h3>
                <button onclick="closeAllUsersModal()" class="text-gray-400 hover:text-white">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            
            <div class="mb-4 p-4 bg-slate-800/50 rounded-xl">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p class="text-gray-400">Toplam Kullanıcı</p>
                        <p class="text-xl font-bold text-white">${allUsers.length}</p>
                    </div>
                    <div>
                        <p class="text-gray-400">Toplam İşlem</p>
                        <p class="text-xl font-bold text-white">${totalTransactions}</p>
                    </div>
                    <div>
                        <p class="text-gray-400">Toplam Liste</p>
                        <p class="text-xl font-bold text-white">${totalLists}</p>
                    </div>
                    <div>
                        <p class="text-gray-400">Toplam Hatırlatıcı</p>
                        <p class="text-xl font-bold text-white">${totalReminders}</p>
                    </div>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto space-y-3 hide-scroll">
                ${usersWithStats.length === 0 ? 
                    '<p class="text-center text-gray-400 py-8">Henüz kayıtlı kullanıcı yok</p>' :
                    usersWithStats.map(user => {
                        const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : 'Bilinmiyor';
                        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : 'Hiç giriş yapmamış';
                        const isActive = DB.currentUser?.id === user.id;
                        
                        return `
                            <div class="bg-slate-800/50 p-4 rounded-xl border ${isActive ? 'border-yellow-500' : 'border-slate-700'}">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-1">
                                            <h4 class="font-bold text-lg ${isActive ? 'text-yellow-400' : 'text-white'}">
                                                ${user.name} ${isActive ? '(Aktif)' : ''}
                                            </h4>
                                        </div>
                                        <p class="text-sm text-gray-400">${user.email}</p>
                                        <p class="text-xs text-gray-500 mt-1">ID: ${user.id}</p>
                                    </div>
                                    ${isActive ? '<span class="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold">Aktif</span>' : ''}
                                </div>
                                
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                                    <div>
                                        <p class="text-gray-400 text-xs">İşlem Sayısı</p>
                                        <p class="text-white font-bold">${user.transactionCount}</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-400 text-xs">Liste Sayısı</p>
                                        <p class="text-white font-bold">${user.listCount}</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-400 text-xs">Hatırlatıcı</p>
                                        <p class="text-white font-bold">${user.reminderCount}</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-400 text-xs">Maaş</p>
                                        <p class="text-white font-bold">${user.hasSalary ? user.salaryAmount.toFixed(2) + ' ₺' : 'Yok'}</p>
                                    </div>
                                </div>
                                
                                <div class="mt-3 pt-3 border-t border-slate-700 text-xs text-gray-400">
                                    <p>Kayıt: ${createdAt}</p>
                                    <p>Son Giriş: ${lastLogin}</p>
                                </div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
            
            <div class="mt-4 flex gap-2">
                <button onclick="exportAllUsersData()" class="flex-1 modern-btn-yellow font-bold py-3 rounded-xl">
                    Verileri Export Et
                </button>
                <button onclick="closeAllUsersModal()" class="flex-1 modern-btn font-bold py-3 rounded-xl">
                    Kapat
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    lucide.createIcons();
}

function closeAllUsersModal() {
    const modal = document.getElementById('all-users-modal');
    if (modal) {
        modal.remove();
    }
}

function exportAllUsersData() {
    const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalUsers: DB.users.length,
        totalTransactions: DB.transactions.length,
        totalLists: DB.shoppingLists.length,
        totalReminders: DB.reminders.length,
        users: DB.users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt || null,
            lastLogin: u.lastLogin || null
        })),
        statistics: {
            totalTransactions: DB.transactions.length,
            totalLists: DB.shoppingLists.length,
            totalReminders: DB.reminders.length,
            usersWithSalary: Object.keys(DB.userSalaries || {}).filter(id => 
                DB.userSalaries[id] && !DB.userSalaries[id].skipped
            ).length
        }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lifewallet_all_users_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('✓ Tüm kullanıcı verileri başarıyla export edildi!');
}

function showDatabaseModal() {
    const modal = document.getElementById('database-modal');
    const content = document.getElementById('database-content');
    
    if (!modal || !content) return;
    
    const dbCopy = {
        currentUser: DB.currentUser,
        users: DB.users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt,
            lastLogin: u.lastLogin
        })),
        transactions: DB.transactions,
        shoppingLists: DB.shoppingLists,
        reminders: DB.reminders,
        recurringTemplates: DB.recurringTemplates,
        userSalaries: DB.userSalaries,
        userApiKeys: Object.keys(DB.userApiKeys).reduce((acc, key) => {
            acc[key] = DB.userApiKeys[key] ? '***' + DB.userApiKeys[key].slice(-4) : null;
            return acc;
        }, {})
    };
    
    content.textContent = JSON.stringify(dbCopy, null, 2);
    modal.classList.remove('hidden');
    lucide.createIcons();
}

function closeDatabaseModal() {
    const modal = document.getElementById('database-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function copyDatabaseToClipboard() {
    const content = document.getElementById('database-content');
    if (!content) return;
    
    const text = content.textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('✓ Veritabanı içeriği panoya kopyalandı!');
    }).catch(err => {
        console.error('Kopyalama hatası:', err);
        alert('Kopyalama başarısız!');
    });
}

