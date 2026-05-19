
// Адрес API — тот же домен, что и статика, но порт 8001
//const API_BASE = 'https://bot-step2.onrender.com'
/*
GET /api/products – возвращает _products_cache_sb (обновляя кэш).
POST /api/orders – принимает {product_id, user_name, user_email} и сохраняет в orders.
GET /api/admin/orders – требует админ-токен, возвращает список заказов.
PATCH /api/admin/orders/{id} – меняет статус.
POST /api/admin/products – добавление товара.
PUT /api/admin/products/{id} – обновление.
DELETE /api/admin/products/{id} – удаление.
*/

// Адрес API (для локальной отладки – http://localhost:8001, для продакшена – https://ваш-сервер.onrender.com)
// const API_BASE = 'http://localhost:8001';   // Поменяйте при деплое
const API_BASE = 'https://bot-step2.onrender.com'
const API_PATHS = {
    products: '/api/products',
    orders: '/api/orders'
};

// Загрузка таблицы товаров
async function loadTableData() {
    try {
        console.log('Запрос к API:', `${API_BASE}${API_PATHS.products}`);
        const response = await fetch(`${API_BASE}${API_PATHS.products}`);
        console.log('Статус ответа:', response.status);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const products = await response.json();
        console.log('Данные от API:', products);
        const tbody = document.getElementById('table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        products.forEach(product => {
            const row = `<tr>
                <td>${product.name}</td>
                <td>${product.price}</td>
                <td>${product.stock}</td>
            </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        // Заполняем выпадающий список выбора товара (если есть)
        const productSelect = document.getElementById('product-select');
        if (productSelect) {
            productSelect.innerHTML = '<option value="">Выберите товар</option>';
            products.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = `${p.name} - ${p.price}`;
                productSelect.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Ошибка загрузки товаров:', err);
    }
}

// Отправка заказа
async function submitOrder(productId, userName, userEmail, quantity = 1) {
    const response = await fetch(`${API_BASE}${API_PATHS.orders}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            product_id: productId,
            user_name: userName,
            user_email: userEmail,
            quantity: quantity
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Ошибка отправки');
    }
    return await response.json();
}

// Обработка формы
document.addEventListener('DOMContentLoaded', () => {
    loadTableData();

    const form = document.getElementById('contactForm');
    const loader = document.getElementById('loader');
    const btn = form.querySelector('button[type="submit"]');

    const showLoader = () => {
        loader.classList.remove('hidden');
        btn.disabled = true;
        btn.textContent = 'Отправка...';
    };
    const hideLoader = () => {
        loader.classList.add('hidden');
        btn.disabled = false;
        btn.textContent = 'Отправить';
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = form.elements.name.value.trim();
        const email = form.elements.email.value.trim();
        const message = form.elements.message.value.trim(); // может быть комментарий

        // ВАЖНО: теперь нужно выбрать товар – добавим select в HTML
        const productSelect = document.getElementById('product-select');
        const productId = productSelect ? parseInt(productSelect.value) : null;
        if (!productId) {
            alert('Выберите товар');
            return;
        }
        if (!name || !email) {
            alert('Заполните имя и email');
            return;
        }

        showLoader();
        try {
            await submitOrder(productId, name, email, 1);
            alert('Заказ успешно отправлен!');
            form.reset();
        } catch (err) {
            alert('Ошибка: ' + err.message);
        } finally {
            hideLoader();
        }
    });
});