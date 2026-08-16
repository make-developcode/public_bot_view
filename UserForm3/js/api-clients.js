const API_SERVERS = [
    'https://botmvp-andreymakedeveloper.amvera.io',
    'https://bot-step2.onrender.com'
    // 'http://localhost:8001'  
];
const API_PATHS = {
    products: '/api/products',
    orders: '/api/orders'
};

let activeApiBase = null;

async function checkServerAvailability(baseUrl) {
    try {
        const response = await fetch(`${baseUrl}${API_PATHS.products}`, {
            method: 'GET',  //HEAD
            signal: AbortSignal.timeout(3000)
        });
        return response.ok;
    } catch {
        return false;
    }
}

async function selectActiveServer() {
    for (const server of API_SERVERS) {
        console.log(`Проверяем сервер: ${server}`);
        const available = await checkServerAvailability(server);
        if (available) {
            activeApiBase = server;
            console.log(`✅ Активный сервер: ${activeApiBase}`);
            return;
        }
    }
    // Если ни один не доступен — используем первый как fallback
    activeApiBase = API_SERVERS[0];
    console.warn(`⚠️ Ни один сервер не доступен, используем: ${activeApiBase}`);
}

async function apiFetch(path, options = {}) {
    if (!activeApiBase) {
        await selectActiveServer();
    }
    const url = `${activeApiBase}${path}`;
    return fetch(url, options);
}

export { apiFetch, selectActiveServer, activeApiBase };