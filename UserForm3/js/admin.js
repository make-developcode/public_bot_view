// Конфигурация
//const API_BASE = 'http://localhost:8001'; // замените на ваш Render URL при деплое
const API_BASE = 'https://bot-step2.onrender.com'
let authToken = localStorage.getItem('adminToken') || null;

// Элементы DOM
const loginPanel = document.getElementById('login-panel');
const adminPanel = document.getElementById('admin-panel');
const tokenInput = document.getElementById('token-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const tabProducts = document.getElementById('tab-products');
const tabOrders = document.getElementById('tab-orders');
const productsSection = document.getElementById('products-section');
const ordersSection = document.getElementById('orders-section');

const prodName = document.getElementById('prod-name');
const prodPrice = document.getElementById('prod-price');
const prodStock = document.getElementById('prod-stock');
const addProductBtn = document.getElementById('add-product-btn');
const productMsg = document.getElementById('product-msg');
const productsTableBody = document.querySelector('#products-table tbody');
const ordersTableBody = document.querySelector('#orders-table tbody');

// Инициализация при загрузке
if (authToken) {
    checkTokenAndEnter();
} else {
    showLogin();
}

// --- Вход / выход ---
loginBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    if (!token) {
        showLoginError('Введите токен');
        return;
    }
    // Проверяем токен, запросив любую админскую конечную точку
    try {
        const resp = await fetch(`${API_BASE}/api/admin/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
            authToken = token;
            localStorage.setItem('adminToken', token);
            showAdmin();
        } else {
            showLoginError('Неверный токен');
        }
    } catch (e) {
        showLoginError('Ошибка сети или сервер недоступен');
    }
});

logoutBtn.addEventListener('click', () => {
    authToken = null;
    localStorage.removeItem('adminToken');
    showLogin();
    tokenInput.value = '';
});

// --- Навигация по вкладкам ---
tabProducts.addEventListener('click', () => switchTab('products'));
tabOrders.addEventListener('click', () => switchTab('orders'));

function switchTab(tab) {
    if (tab === 'products') {
        tabProducts.classList.add('active');
        tabOrders.classList.remove('active');
        productsSection.classList.remove('hidden');
        ordersSection.classList.add('hidden');
        loadProducts();
    } else {
        tabOrders.classList.add('active');
        tabProducts.classList.remove('active');
        ordersSection.classList.remove('hidden');
        productsSection.classList.add('hidden');
        loadOrders();
    }
}

// --- Вспомогательные функции ---
function showLogin() {
    loginPanel.classList.remove('hidden');
    adminPanel.classList.add('hidden');
}

function showAdmin() {
    loginPanel.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    switchTab('products'); // по умолчанию показываем товары
}

function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove('hidden');
    setTimeout(() => loginError.classList.add('hidden'), 3000);
}

function showProductMessage(msg, isError = false) {
    productMsg.textContent = msg;
    productMsg.className = isError ? 'error' : 'success';
    productMsg.classList.remove('hidden');
    setTimeout(() => productMsg.classList.add('hidden'), 3000);
}

// --- Загрузка товаров ---
async function loadProducts() {
    try {
        const resp = await fetch(`${API_BASE}/api/products`);
        if (!resp.ok) throw new Error('Ошибка загрузки');
        const products = await resp.json();
        renderProducts(products);
    } catch (e) {
        console.error(e);
    }
}

function renderProducts(products) {
    productsTableBody.innerHTML = '';
    products.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p.id}</td>
            <td><input type="text" value="${escapeHtml(p.name)}" data-id="${p.id}" data-field="name" class="edit-field"></td>
            <td><input type="text" value="${escapeHtml(p.price)}" data-id="${p.id}" data-field="price" class="edit-field"></td>
            <td><input type="text" value="${escapeHtml(p.stock)}" data-id="${p.id}" data-field="stock" class="edit-field"></td>
            <td>
                <button class="btn-small save-btn" data-id="${p.id}">Сохранить</button>
                <button class="btn-small delete-btn" data-id="${p.id}" style="background:#c62828;">Удалить</button>
            </td>
        `;
        productsTableBody.appendChild(row);
    });

    // Обработчики кнопок
    document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const fields = document.querySelectorAll(`.edit-field[data-id="${id}"]`);
            const data = {};
            fields.forEach(f => { data[f.dataset.field] = f.value; });
            await updateProduct(id, data);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (confirm('Удалить товар навсегда?')) {
                await deleteProduct(id);
            }
        });
    });
}

// --- Добавление товара ---
addProductBtn.addEventListener('click', async () => {
    const name = prodName.value.trim();
    const price = prodPrice.value.trim();
    const stock = prodStock.value.trim();
    if (!name || !price || !stock) {
        showProductMessage('Заполните все поля', true);
        return;
    }
    try {
        const resp = await fetch(`${API_BASE}/api/admin/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, price, stock })
        });
        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.detail || 'Ошибка');
        }
        showProductMessage('Товар добавлен');
        prodName.value = '';
        prodPrice.value = '';
        prodStock.value = '';
        loadProducts();
    } catch (e) {
        showProductMessage(e.message, true);
    }
});

// --- Обновление товара ---
async function updateProduct(id, data) {
    try {
        const resp = await fetch(`${API_BASE}/api/admin/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.detail || 'Ошибка');
        }
        showProductMessage('Товар обновлён');
        loadProducts();
    } catch (e) {
        showProductMessage(e.message, true);
    }
}

// --- Удаление товара ---
async function deleteProduct(id) {
    try {
        const resp = await fetch(`${API_BASE}/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.detail || 'Ошибка');
        }
        showProductMessage('Товар удалён');
        loadProducts();
    } catch (e) {
        showProductMessage(e.message, true);
    }
}

// --- Загрузка заказов ---
async function loadOrders() {
    try {
        const resp = await fetch(`${API_BASE}/api/admin/orders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!resp.ok) throw new Error('Ошибка загрузки');
        const orders = await resp.json();
        renderOrders(orders);
    } catch (e) {
        console.error(e);
    }
}

function renderOrders(orders) {
    ordersTableBody.innerHTML = '';
    orders.forEach(order => {
        const productName = order.products ? order.products.name : `ID ${order.product_id}`;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${escapeHtml(order.customer_name || '—')}</td>
            <td>${escapeHtml(order.customer_email || '—')}</td>
            <td>${escapeHtml(productName)}</td>
            <td>${order.quantity}</td>
            <td>
                <select data-id="${order.id}" class="status-select">
                    <option value="new" ${order.status === 'new' ? 'selected' : ''}>Новый</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Подтверждён</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Выполнен</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Отменён</option>
                </select>
            </td>
            <td>
                <button class="btn-small update-status-btn" data-id="${order.id}">Обновить</button>
            </td>
        `;
        ordersTableBody.appendChild(row);
    });

    document.querySelectorAll('.update-status-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const select = document.querySelector(`.status-select[data-id="${id}"]`);
            const newStatus = select.value;
            await updateOrderStatus(id, newStatus);
        });
    });
}

async function updateOrderStatus(orderId, status) {
    try {
        const resp = await fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });
        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.detail || 'Ошибка');
        }
        loadOrders(); // перезагружаем список
    } catch (e) {
        alert('Ошибка обновления статуса: ' + e.message);
    }
}

// Утилита для безопасности HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Проверка токена при начальной загрузке
async function checkTokenAndEnter() {
    try {
        const resp = await fetch(`${API_BASE}/api/admin/orders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (resp.ok) {
            showAdmin();
        } else {
            authToken = null;
            localStorage.removeItem('adminToken');
            showLogin();
        }
    } catch {
        showLogin();
    }
}