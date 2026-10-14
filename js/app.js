function toggleTestDatePanel() {
    const panel = document.getElementById('test-date-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        const testDate = testDateOverride || new Date().toISOString().split('T')[0];
        document.getElementById('test-date-input').value = testDate;
        updateTestDateDisplay();
    }
}

function setTestDate() {
    const dateInput = document.getElementById('test-date-input').value;
    if (!dateInput) {
        alert('Lütfen bir tarih seçiniz');
        return;
    }
    testDateOverride = dateInput;
    if (typeof window !== 'undefined') {
        window.testDateOverride = dateInput;
    }
    localStorage.setItem('lifeWalletTestDate', dateInput);
    updateTestDateDisplay();
    
    try {
        processRecurringTemplates();
    } catch(e) {
        console.error('processRecurringTemplates hatası:', e);
    }
    
    updateDashboard();
    renderTransactions();
    alert(`Test tarihi ayarlandı: ${dateInput}`);
}

function resetTestDate() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const beforeCount = DB.transactions.length;
    
    console.log('Bugünün tarihi:', todayStr);
    console.log('Silinmeden önce toplam işlem:', beforeCount);
    
    const storedTestDate = localStorage.getItem('lifeWalletTestDate');
    const testDateValue = (typeof window !== 'undefined' && window.testDateOverride) || 
                          (typeof testDateOverride !== 'undefined' && testDateOverride !== null) ||
                          storedTestDate;
    
    const testTransactions = DB.transactions.filter(t => t.isTestTransaction === true);
    console.log('isTestTransaction işaretli işlemler:', testTransactions);
    
    const futureSalaryTransactions = DB.transactions.filter(t => {
        const isFuture = t.date > todayStr;
        const isSalary = t.desc === 'Maaş' && t.type === 'income';
        return isFuture && isSalary;
    });
    console.log('İleri tarihli maaş işlemleri:', futureSalaryTransactions);
    
    let unmarkedTestSalaries = [];
    if (testDateValue) {
        const testDate = new Date(testDateValue);
        const testDateStr = testDate.toISOString().split('T')[0];
        
        unmarkedTestSalaries = DB.transactions.filter(t => {
            const isSalary = t.desc === 'Maaş' && t.type === 'income';
            const isAfterTestDate = t.date >= testDateStr;
            const isNotToday = t.date !== todayStr;
            const isNotMarked = !t.isTestTransaction;
            return isSalary && isAfterTestDate && isNotToday && isNotMarked;
        });
        console.log('İşaretlenmemiş test maaş işlemleri:', unmarkedTestSalaries);
    }
    
    const testTransactionIds = new Set([
        ...testTransactions.map(t => t.id),
        ...futureSalaryTransactions.map(t => t.id),
        ...unmarkedTestSalaries.map(t => t.id)
    ]);
    
    DB.transactions = DB.transactions.filter(t => {
        if (testTransactionIds.has(t.id)) {
            console.log('Siliniyor (test işlemi):', t);
            return false;
        }
        return true;
    });
    
    const afterCount = DB.transactions.length;
    const deletedCount = beforeCount - afterCount;
    
    console.log(`${deletedCount} adet test işlemi silindi (önce: ${beforeCount}, sonra: ${afterCount})`);
    console.log('Kalan işlemler:', DB.transactions.length);
    
    testDateOverride = null;
    if (typeof window !== 'undefined') {
        window.testDateOverride = null;
    }
    localStorage.removeItem('lifeWalletTestDate');
    document.getElementById('test-date-input').value = todayStr;
    updateTestDateDisplay();
    
    saveData();
    
    updateDashboard();
    renderTransactions();
    
    try {
        processRecurringTemplates();
    } catch(e) {
        console.error('processRecurringTemplates hatası:', e);
    }
    
    updateDashboard();
    renderTransactions();
    
    alert(`Test tarihi sıfırlandı - bugünkü tarih kullanılıyor${deletedCount > 0 ? `\n${deletedCount} adet test işlemi silindi.` : ''}`);
}

function updateTestDateDisplay() {
    const display = document.getElementById('test-date-display');
    if (testDateOverride) {
        const d = new Date(testDateOverride);
        display.innerText = d.toLocaleDateString('tr-TR');
    } else {
        display.innerText = 'Bugün';
    }
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    
    const topNav = document.getElementById('top-nav');
    if (topNav) topNav.classList.remove('hidden');
    
    updateNavigationForScreenSize();
    
    document.getElementById('display-name').innerText = DB.currentUser.name;
    
    lucide.createIcons();
    
    setTimeout(function() {
        const apiBtn = document.querySelector('button[onclick="toggleApiKeyModal()"]');
        if (apiBtn) {
            apiBtn.style.display = 'block';
            apiBtn.style.visibility = 'visible';
            apiBtn.style.opacity = '1';
            console.log('API Key butonu bulundu ve görünür yapıldı');
        } else {
            console.error('API Key butonu bulunamadı!');
        }
    }, 100);
    
    let currentUserId = null;
    if (DB.currentUser && DB.currentUser.id) {
        currentUserId = DB.currentUser.id;
    }
    const userSalary = currentUserId ? DB.userSalaries[currentUserId] : null;
    
    if (!userSalary) {
        document.getElementById('salary-setup-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
    } else {
        document.getElementById('salary-setup-screen').classList.add('hidden');
        goToHome();
    }
}

function goToHome() {
    const allTabs = document.querySelectorAll('.tab-content');
    for (let i = 0; i < allTabs.length; i++) {
        allTabs[i].classList.remove('active');
    }
    document.getElementById('tab-dashboard').classList.add('active');
    
    const mobileDropdown = document.getElementById('mobile-dropdown');
    if (mobileDropdown && !mobileDropdown.classList.contains('hidden')) {
        if (typeof toggleMobileMenu === 'function') {
            toggleMobileMenu();
        }
    }
    
    const allNavLinks = document.querySelectorAll('.nav-link');
    for (let i = 0; i < allNavLinks.length; i++) {
        allNavLinks[i].classList.remove('active-nav');
    }
    
    updateDashboard();
    
    lucide.createIcons();
}

function setupSalary() {
    const amount = parseFloat(String(document.getElementById('setup-salary-amount').value).replace(',', '.'));
    const salaryDateInput = document.getElementById('setup-salary-date').value;

    if (!amount || isNaN(amount) || amount <= 0) return alert('Geçerli bir tutar girin');
    if (!salaryDateInput) return alert('Bir tarih seçin');

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

    document.getElementById('salary-setup-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    updateDashboard();
    renderTransactions();
    renderShoppingLists();
    renderReminders();
}

function skipSalarySetup() {
    if (!DB.currentUser) {
        alert('Lütfen önce giriş yapın!');
        return;
    }

    DB.userSalaries[DB.currentUser.id] = { skipped: true };
    saveData();
    
    document.getElementById('salary-setup-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    updateDashboard();
    renderTransactions();
    renderShoppingLists();
    renderReminders();
}

function switchTab(tabId) {
    if (tabId === 'dashboard') {
        goToHome();
        return;
    }
    
    const allTabs = document.querySelectorAll('.tab-content');
    for (let i = 0; i < allTabs.length; i++) {
        allTabs[i].classList.remove('active');
    }
    document.getElementById('tab-' + tabId).classList.add('active');
    
    const mobileDropdown = document.getElementById('mobile-dropdown');
    if (mobileDropdown && !mobileDropdown.classList.contains('hidden')) {
        toggleMobileMenu();
    }
    
    const allNavLinks = document.querySelectorAll('.nav-link');
    for (let i = 0; i < allNavLinks.length; i++) {
        const navButton = allNavLinks[i];
        navButton.classList.remove('active-nav');
        if (navButton.getAttribute('data-tab') === tabId) {
            navButton.classList.add('active-nav');
        }
    }
    
    const allDesktopNavButtons = document.querySelectorAll('.desktop-nav-btn');
    for (let i = 0; i < allDesktopNavButtons.length; i++) {
        const desktopButton = allDesktopNavButtons[i];
        desktopButton.classList.remove('active-nav');
        if (desktopButton.getAttribute('data-tab') === tabId) {
            desktopButton.classList.add('active-nav');
        }
    }
    
    lucide.createIcons();
    
    if(tabId === 'transactions') {
        renderTransactions();
    } else if(tabId === 'lists') {
        renderShoppingLists();
    } else if(tabId === 'reminders') {
        renderReminders();
    } else if(tabId === 'settings') {
        renderUsersList();
        renderSalaryManagement();
        updateApiKeyDisplay();
        if (typeof loadTheme === 'function') {
            loadTheme();
        }
    }
}

let scrollPosition = 0;

function toggleMobileMenu() {
    const dropdown = document.getElementById('mobile-dropdown');
    const icon = document.getElementById('mobile-menu-icon');
    
    if (dropdown && icon) {
        const isOpen = !dropdown.classList.contains('hidden');
        
        if (isOpen) {
            dropdown.classList.add('closing');
            icon.setAttribute('data-lucide', 'menu');
            
            setTimeout(() => {
                dropdown.classList.remove('closing');
                dropdown.classList.add('hidden');
                
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
                
                window.scrollTo(0, scrollPosition);
            }, 400);
        } else {
            scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            
            dropdown.classList.remove('hidden');
            dropdown.classList.remove('closing');
            icon.setAttribute('data-lucide', 'x');
        }
        
        setTimeout(() => {
            lucide.createIcons();
        }, 50);
    }
}

document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('mobile-dropdown');
    const menuBtn = document.getElementById('mobile-menu-btn');
    
    if (dropdown && menuBtn && !dropdown.classList.contains('hidden')) {
        if (!dropdown.contains(event.target) && !menuBtn.contains(event.target)) {
            toggleMobileMenu();
        }
    }
});

// Pencere boyutu değiştiğinde navigasyonu güncelle
function updateNavigationForScreenSize() {
    const bottomNav = document.getElementById('bottom-nav');
    const appScreen = document.getElementById('app-screen');
    const mobileDropdown = document.getElementById('mobile-dropdown');
    
    // Sadece kullanıcı giriş yapmışsa kontrol et
    const isLoggedIn = appScreen && !appScreen.classList.contains('hidden');
    
    if (window.innerWidth >= 1024) {
        // Masaüstü: alt nav ve mobil dropdown gizle
        if (bottomNav) bottomNav.classList.add('hidden');
        if (mobileDropdown) mobileDropdown.classList.add('hidden');
    } else {
        // Mobil: alt nav göster (giriş yapılmışsa)
        if (bottomNav && isLoggedIn) {
            bottomNav.classList.remove('hidden');
        }
    }
}


// Pencere boyutu değiştiğinde kontrol et
window.addEventListener('resize', updateNavigationForScreenSize);

// Splash Screen'i göster ve animasyonu başlat
function initSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const splashTitle = document.getElementById('splash-title');
    const continueBtn = document.getElementById('splash-continue-btn');
    
    if (!splashScreen) return;
    
    // Splash screen'i her zaman göster
    splashScreen.classList.remove('hidden');
    
    // Login ekranını gizle
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.classList.add('hidden');
    
    // App screen'i gizle
    const appScreen = document.getElementById('app-screen');
    if (appScreen) appScreen.classList.add('hidden');
    
    // Başlık animasyonu başladıktan sonra butonu göster
    setTimeout(() => {
        if (continueBtn) continueBtn.classList.remove('hidden');
    }, 1200);
}

function showLoginScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const loginScreen = document.getElementById('login-screen');
    
    if (splashScreen) {
        splashScreen.classList.add('fade-out');
        setTimeout(() => {
            splashScreen.classList.add('hidden');
        }, 600);
    }
    
    if (loginScreen) {
        setTimeout(() => {
            loginScreen.classList.remove('hidden');
        }, 300);
    }
}

window.onload = () => {
    loadData();
    
    const storedTestDate = localStorage.getItem('lifeWalletTestDate');
    if (storedTestDate) testDateOverride = storedTestDate;
    
    const oldApiKey = localStorage.getItem('lifeWalletRapidApiKey');
    if (oldApiKey && DB.currentUser) {
        DB.userApiKeys[DB.currentUser.id] = oldApiKey;
        localStorage.removeItem('lifeWalletRapidApiKey');
        saveData();
    }
    
    try { processRecurringTemplates(); } catch(e) { }

    lucide.createIcons();

    renderCategories();
    
    if (typeof setTransType === 'function') {
        setTransType(currentTransType);
    }
    
    updateTestDateDisplay();

    const topNav = document.getElementById('top-nav');
    if (topNav) topNav.classList.add('hidden');
    initSplashScreen();
};

