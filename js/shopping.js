function createList() {
    const name = document.getElementById('new-list-name').value;
    if(!name) return;
    
    DB.shoppingLists.push({
        id: Date.now(),
        name: name,
        items: [],
        userId: DB.currentUser?.id || null
    });
    saveData();
    document.getElementById('new-list-name').value = '';
    renderShoppingLists();
}

function renderShoppingLists() {
    const container = document.getElementById('shopping-lists-container');

    function fmtPrice(v){
        if (v === null || v === undefined || v === '') return '';
        return Number(v).toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 2});
    }

    container.innerHTML = DB.shoppingLists.map(list => `
        <div class="glass p-4 rounded-xl">
            <div class="flex justify-between items-center mb-3">
                <h4 class="font-bold accent-yellow">${list.name}</h4>
                <button onclick="deleteList(${list.id})" class="text-xs text-gray-400">Listeyi Sil</button>
            </div>
            
            <div class="flex gap-2 mb-3">
                <button onclick="openProductSearch(${list.id})" class="flex-1 modern-btn-yellow px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2" title="Ürün Ara">
                    <i data-lucide="search" class="w-4 h-4"></i>
                    <span>Ürün Ara</span>
                </button>
            </div>

            <ul class="space-y-2">
                ${list.items.map(item => `
                    <li class="flex items-center gap-2 text-sm ${item.bought ? 'opacity-40 line-through' : ''}">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-10 h-10 rounded object-cover">` : ''}
                        <input type="checkbox" ${item.bought ? 'checked' : ''} onchange="toggleItem(${list.id}, ${item.id})" class="accent-blue-500 w-4 h-4">
                        <span class="flex-1">${item.name}</span>
                        <span class="text-gray-400">${(item.price || item.price === 0) ? fmtPrice(item.price) + ' ₺' : ''}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
    lucide.createIcons();
}

function toggleItem(listId, itemId) {
    const list = DB.shoppingLists.find(l => l.id === listId);
    const item = list.items.find(i => i.id === itemId);
    if (!item) return;

    item.bought = !item.bought;

    if (item.bought) {
        if (item.price && item.price > 0 && !item.expenseAdded) {
            const today = new Date().toISOString().split('T')[0];
            const tx = {
                id: Date.now(),
                type: 'expense',
                amount: item.price,
                category: list.name, // kategori olarak liste adını kullan
                desc: item.name,
                date: today,
                userId: DB.currentUser?.id || null
            };
            DB.transactions.unshift(tx);
            item.expenseAdded = true;
            item.expenseId = tx.id;
        }
    } else {
        if (item.expenseAdded && item.expenseId) {
            DB.transactions = DB.transactions.filter(t => t.id !== item.expenseId);
            item.expenseAdded = false;
            item.expenseId = null;
        }
    }

    saveData();
    renderShoppingLists();
    updateDashboard();
    renderTransactions();
}

function deleteList(id) {
    if(confirm("Liste silinsin mi?")) {
        DB.shoppingLists = DB.shoppingLists.filter(l => l.id !== id);
        saveData();
        renderShoppingLists();
    }
}

