const DB = {
    currentUser: null,
    users: [],
    transactions: [],
    shoppingLists: [],
    reminders: [],
    recurringTemplates: [],
    userSalaries: {},
    userApiKeys: {}
};

function saveData() {
    localStorage.setItem('lifeWalletDB', JSON.stringify(DB));
    saveUsersToFile();
}

function saveUsersToFile() {
    const usersData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        users: DB.users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt || null,
            lastLogin: u.lastLogin || null
        }))
    };
    localStorage.setItem('lifeWalletUsers', JSON.stringify(usersData));
}



function loadData() {
    const storedData = localStorage.getItem('lifeWalletDB');
    if (storedData) {
        Object.assign(DB, JSON.parse(storedData));
    }
    
    const usersFile = localStorage.getItem('lifeWalletUsers');
    if (usersFile) {
        try {
            const usersData = JSON.parse(usersFile);
            if (usersData.users && Array.isArray(usersData.users)) {
                usersData.users.forEach(fileUser => {
                    const dbUser = DB.users.find(u => u.id === fileUser.id);
                    if (dbUser) {
                        if (fileUser.createdAt) dbUser.createdAt = fileUser.createdAt;
                        if (fileUser.lastLogin) dbUser.lastLogin = fileUser.lastLogin;
                    }
                });
            }
        } catch(e) {
            console.error('Users dosyası yüklenirken hata:', e);
        }
    }
}

function exportDatabase() {
    const dataStr = JSON.stringify(DB, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lifewallet_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('✓ Veritabanı başarıyla export edildi!');
}

// JSON dosyasından veritabanını import et
function importDatabase(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.users || !Array.isArray(importedData.users)) {
                return alert('Geçersiz veri formatı!');
            }
            
            if (confirm('Mevcut verileriniz silinecek ve yeni veriler yüklenecek. Devam etmek istiyor musunuz?')) {
                const currentUserId = DB.currentUser?.id;
                
                Object.assign(DB, importedData);
                
                if (currentUserId && DB.users.find(u => u.id === currentUserId)) {
                    DB.currentUser = {
                        id: currentUserId,
                        name: DB.users.find(u => u.id === currentUserId).name,
                        email: DB.users.find(u => u.id === currentUserId).email
                    };
                } else {
                    DB.currentUser = null;
                }
                
                saveData();
                alert('Veritabanı başarıyla import edildi! Sayfa yenilenecek...');
                location.reload();
            }
        } catch (error) {
            console.error('Import hatası:', error);
            alert('Dosya okunamadı! Geçerli bir JSON dosyası seçin.');
        }
    };
    reader.readAsText(file);
}

function exportUsers() {
    const usersFile = localStorage.getItem('lifeWalletUsers');
    let usersData;
    
    if (usersFile) {
        usersData = JSON.parse(usersFile);
        usersData.exportDate = new Date().toISOString();
        usersData.users = DB.users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt || null,
            lastLogin: u.lastLogin || null
        }));
    } else {
        usersData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            users: DB.users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                createdAt: u.createdAt || null,
                lastLogin: u.lastLogin || null
            }))
        };
    }
    
    const dataStr = JSON.stringify(usersData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Kullanıcı listesi users.json dosyasına export edildi!');
}

function importUsersFromFile(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedUsers = JSON.parse(e.target.result);
            
            if (!importedUsers.users || !Array.isArray(importedUsers.users)) {
                return alert('Geçersiz users.json formatı!');
            }
            
            if (confirm(`${importedUsers.users.length} kullanıcı yüklenecek. Mevcut kullanıcılar güncellenecek. Devam etmek istiyor musunuz?`)) {
                let updatedCount = 0;
                let addedCount = 0;
                
                importedUsers.users.forEach(fileUser => {
                    const existingUser = DB.users.find(u => u.id === fileUser.id || u.email === fileUser.email);
                    
                    if (existingUser) {
                        if (fileUser.name) existingUser.name = fileUser.name;
                        if (fileUser.createdAt) existingUser.createdAt = fileUser.createdAt;
                        if (fileUser.lastLogin) existingUser.lastLogin = fileUser.lastLogin;
                        updatedCount++;
                    } else {
                        DB.users.push({
                            id: fileUser.id || Date.now(),
                            name: fileUser.name,
                            email: fileUser.email,
                            passwordHash: '',
                            createdAt: fileUser.createdAt || new Date().toISOString(),
                            lastLogin: fileUser.lastLogin || null
                        });
                        addedCount++;
                    }
                });
                
                saveData();
                alert(`${updatedCount} kullanıcı güncellendi, ${addedCount} yeni kullanıcı eklendi!`);
                if (typeof renderUsersList === 'function') {
                    renderUsersList();
                }
            }
        } catch (error) {
            console.error('Import hatası:', error);
            alert('users.json dosyası okunamadı! Geçerli bir JSON dosyası seçin.');
        }
    };
    reader.readAsText(file);
}

