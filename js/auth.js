function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const btnLogin = document.getElementById('btn-tab-login');
    const btnSignup = document.getElementById('btn-tab-signup');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        btnLogin.classList.add('bg-accent-yellow', 'text-black');
        btnLogin.classList.remove('text-gray-400');
        btnSignup.classList.remove('bg-accent-yellow', 'text-black');
        btnSignup.classList.add('text-gray-400');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        btnSignup.classList.add('bg-accent-yellow', 'text-black');
        btnSignup.classList.remove('text-gray-400');
        btnLogin.classList.remove('bg-accent-yellow', 'text-black');
        btnLogin.classList.add('text-gray-400');
    }
}

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}

function signupUser() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;

    if (!name || !email || !password || !confirmPassword) {
        return alert("Tüm alanları doldurunuz!");
    }

    if (password.length < 6) {
        return alert("Şifre en az 6 karakter olmalıdır!");
    }

    if (password !== confirmPassword) {
        return alert("Şifreler eşleşmiyor!");
    }

    if (DB.users.find(u => u.email === email)) {
        return alert("Bu e-posta zaten kayıtlı!");
    }

    const passwordHash = hashPassword(password);

    const newUser = {
        id: Date.now(),
        name,
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
        lastLogin: null
    };
    
    DB.users.push(newUser);
    
    saveData();
    
    alert("Kayıt başarılı! Giriş ekranı açılıyor...");
    
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-password-confirm').value = '';
    switchAuthTab('login');
}

function loginUser() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        return alert("E-posta ve şifreyi giriniz!");
    }

    const user = DB.users.find(u => u.email === email);
    if (!user) {
        return alert("Kullanıcı bulunamadı!");
    }

    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
        return alert("Şifre yanlış!");
    }

    DB.currentUser = {
        id: user.id,
        name: user.name,
        email: user.email
    };

    user.lastLogin = new Date().toISOString();

    saveData();
    
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.classList.add('hidden');
    
    showApp();
}

function logout() {
    if(confirm("Çıkış yapılsın mı?")) {
        DB.currentUser = null;
        saveData();
        
        const topNav = document.getElementById('top-nav');
        if (topNav) topNav.classList.add('hidden');
        
        location.reload();
    }
}

