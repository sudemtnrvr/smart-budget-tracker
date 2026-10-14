function toggleApiKeyModal() {
    const modal = document.getElementById('api-key-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        const currentKey = getCurrentUserApiKey();
        if (currentKey) {
            document.getElementById('rapidapi-key-input').value = currentKey;
        } else {
            document.getElementById('rapidapi-key-input').value = '';
        }
        lucide.createIcons();
    }
}

function updateApiKeyAfterSave() {
    updateApiKeyDisplay();
}

function saveApiKey() {
    if (!DB.currentUser) {
        alert('Lütfen önce giriş yapın!');
        return;
    }

    const key = document.getElementById('rapidapi-key-input').value.trim();
    if (!key) {
        alert('Lütfen bir API key girin');
        return;
    }

    DB.userApiKeys[DB.currentUser.id] = key;
    saveData();
    toggleApiKeyModal();
    
    if (typeof updateApiKeyDisplay === 'function') {
        updateApiKeyDisplay();
    }
    
    alert('API key kaydedildi! Artık ürün arama özelliğini kullanabilirsiniz.');
}

function openProductSearch(listId) {
    const apiKey = getCurrentUserApiKey();
    if (!apiKey) {
        alert('Önce RapidAPI key\'inizi ayarlayın. Ayarlar butonuna tıklayın.');
        toggleApiKeyModal();
        return;
    }
    currentListIdForProduct = listId;
    const modal = document.getElementById('product-search-modal');
    modal.classList.remove('hidden');
    document.getElementById('product-search-input').focus();
    lucide.createIcons();
}

function closeProductSearch() {
    const modal = document.getElementById('product-search-modal');
    modal.classList.add('hidden');
    document.getElementById('product-search-results').innerHTML = '<p class="text-center text-gray-400 py-8">Arama yapmak için yukarıdaki alanı kullanın</p>';
}

async function searchProducts() {
    const query = document.getElementById('product-search-input').value.trim();
    if (!query) {
        alert('Lütfen bir arama terimi girin');
        return;
    }

    const rapidApiKey = getCurrentUserApiKey();
    if (!rapidApiKey) {
        alert('Önce RapidAPI key\'inizi ayarlayın. Ayarlar butonuna tıklayın.');
        return;
    }

    const resultsDiv = document.getElementById('product-search-results');
    resultsDiv.innerHTML = '<div class="text-center py-8"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div><p class="text-gray-400 mt-2">Aranıyor...</p></div>';

    let lastError = null;
    const apiKey = getCurrentUserApiKey();

    try {
        const response = await fetch(`https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&country=TR&sort_by=RELEVANCE`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const products = data.data?.products || data.products || [];
            if (products.length > 0) {
                displayProducts(products);
                return;
            }
        }
        throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        lastError = error;
        console.log('API 1 başarısız:', error.message);
    }

    try {
        const altResponse = await fetch(`https://amazon-product-data.p.rapidapi.com/search?query=${encodeURIComponent(query)}&country=TR`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'amazon-product-data.p.rapidapi.com'
            }
        });

        if (altResponse.ok) {
            const altData = await altResponse.json();
            const products = altData.results || altData.data?.products || altData.products || [];
            if (products.length > 0) {
                displayProducts(products);
                return;
            }
        }
        throw new Error(`HTTP ${altResponse.status}`);
    } catch (altError) {
        lastError = altError;
        console.log('API 2 başarısız:', altError.message);
    }

    try {
        const genResponse = await fetch(`https://amazon-product-reviews1.p.rapidapi.com/product/search?keyword=${encodeURIComponent(query)}&country=TR`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'amazon-product-reviews1.p.rapidapi.com'
            }
        });

        if (genResponse.ok) {
            const genData = await genResponse.json();
            const products = genData.products || genData.results || genData.data?.products || [];
            if (products.length > 0) {
                displayProducts(products);
                return;
            }
        }
        throw new Error(`HTTP ${genResponse.status}`);
    } catch (genError) {
        lastError = genError;
        console.log('API 3 başarısız:', genError.message);
    }

    const errorCode = lastError?.message || 'Bilinmeyen hata';
    const is403 = errorCode.includes('403') || errorCode.includes('Forbidden');
    
    resultsDiv.innerHTML = `
        <div class="text-center py-8">
            <p class="text-gray-400 mb-2 font-bold text-lg">${is403 ? 'API Aboneliği Gerekli!' : 'API Bağlantı Hatası'}</p>
            <p class="text-sm text-gray-400 mb-4">${is403 ? 'API key doğru ama API\'ye abone olmamışsınız!' : 'Ürün bulunamadı veya API key geçersiz olabilir.'}</p>
            <div class="text-xs text-gray-500 space-y-2 text-left bg-slate-800 p-4 rounded-lg mb-4">
                ${is403 ? `
                    <p class="font-bold accent-yellow mb-2">🔧 Çözüm Adımları:</p>
                    <ol class="list-decimal list-inside space-y-1">
                        <li>RapidAPI'de bir Amazon ürün API'sine gidin</li>
                        <li>"Subscribe" veya "Subscribe to Test" butonuna tıklayın</li>
                        <li>Ücretsiz planı seçin (genelde "Basic" veya "Free")</li>
                        <li>Tekrar deneyin</li>
                    </ol>
                    <div class="mt-3 pt-3 border-t border-gray-700">
                        <p class="font-bold mb-1">Önerilen API'ler:</p>
                        <a href="https://rapidapi.com/DataForSEO/api/real-time-amazon-data" target="_blank" class="accent-yellow underline block">• Real-time Amazon Product Data</a>
                        <a href="https://rapidapi.com/amazon-product-data6/api/amazon-product-data" target="_blank" class="accent-yellow underline block">• Amazon Product Data API</a>
                    </div>
                ` : `
                    <p>• API key'inizi kontrol edin</p>
                    <p>• RapidAPI'de ilgili API'ye abone olduğunuzdan emin olun</p>
                    <p>• Farklı bir arama terimi deneyin</p>
                `}
            </div>
            <p class="text-xs text-gray-600 mt-4">Hata kodu: ${errorCode}</p>
        </div>
    `;
}

function displayProducts(products) {
    const resultsDiv = document.getElementById('product-search-results');
    
    if (!products || products.length === 0) {
        resultsDiv.innerHTML = '<p class="text-center text-gray-400 py-8">Ürün bulunamadı</p>';
        return;
    }

    resultsDiv.innerHTML = products.slice(0, 20).map((product, index) => {
        const title = product.product_title || product.title || product.name || 'İsimsiz Ürün';
        let price = product.product_price || product.price || product.price_value || product.price_in_currency || product.price_value_raw || null;
        
        // Fiyat string ise temizle ve parse et
        if (typeof price === 'string') {
            price = price.replace(/[^\d.,]/g, '').replace(',', '.');
            price = parseFloat(price);
        }
        
        const image = product.product_photo || product.image || product.thumbnail || product.product_image || product.main_image || '';
        const currency = product.currency || product.price_currency || '₺';
        const formattedPrice = price && !isNaN(price) ? `${price.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${currency}` : 'Fiyat bilgisi yok';

        const safeTitle = title.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const safeImage = image.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        return `
            <div class="glass p-3 rounded-xl flex gap-3 cursor-pointer hover:bg-slate-700/50 transition-all" onclick="selectProduct(${index})" data-product-index="${index}">
                ${image ? `<img src="${safeImage}" alt="${safeTitle}" class="w-16 h-16 rounded object-cover flex-shrink-0" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="w-16 h-16 rounded bg-slate-700 flex items-center justify-center flex-shrink-0 hidden"><i data-lucide="image" class="w-6 h-6 text-gray-500"></i></div>` : '<div class="w-16 h-16 rounded bg-slate-700 flex items-center justify-center flex-shrink-0"><i data-lucide="image" class="w-6 h-6 text-gray-500"></i></div>'}
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm line-clamp-2 mb-1">${safeTitle}</p>
                    <p class="accent-yellow font-bold text-sm">${formattedPrice}</p>
                </div>
                <button class="modern-btn-yellow px-3 py-1 rounded-lg text-xs font-medium">
                    Seç
                </button>
            </div>
        `;
    }).join('');

    window.lastSearchResults = products.slice(0, 20);

    lucide.createIcons();
}

function selectProduct(index) {
    if (!currentListIdForProduct) {
        alert('Liste bulunamadı');
        return;
    }

    if (!window.lastSearchResults || !window.lastSearchResults[index]) {
        alert('Ürün bulunamadı');
        return;
    }

    const product = window.lastSearchResults[index];
    const list = DB.shoppingLists.find(l => l.id === currentListIdForProduct);
    if (!list) {
        alert('Liste bulunamadı');
        return;
    }

    const title = product.product_title || product.title || product.name || 'İsimsiz Ürün';
    let price = product.product_price || product.price || product.price_value || product.price_in_currency || product.price_value_raw || 0;
    
    if (typeof price === 'string') {
        price = price.replace(/[^\d.,]/g, '').replace(',', '.');
        price = parseFloat(price) || 0;
    }
    if (isNaN(price)) price = 0;

    const image = product.product_photo || product.image || product.thumbnail || product.product_image || product.main_image || null;

    list.items.push({
        id: Date.now(),
        name: title,
        price: price,
        image: image,
        bought: false,
        expenseAdded: false,
        expenseId: null
    });

    saveData();
    renderShoppingLists();
    closeProductSearch();
    alert('Ürün listeye eklendi!');
}

setTimeout(() => {
    const searchInput = document.getElementById('product-search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchProducts();
            }
        });
    }
}, 1000);

