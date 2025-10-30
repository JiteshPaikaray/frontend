const API_URL = 'http://localhost:5144';

const defaultHeaders = {
    'Content-Type': 'application/json'
};

async function fetchJson(path, options = {}) {
    const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const fetchOptions = {
        credentials: 'include', // Include credentials since CORS is configured on backend
        headers: { ...defaultHeaders, ...(options.headers || {}) },
        ...options,
    };

    const res = await fetch(url, fetchOptions);
    if (!res.ok) {
        const body = await res.text().catch(() => null);
        const err = new Error(`Request failed with status ${res.status}: ${res.statusText}`);
        err.status = res.status;
        err.body = body;
        throw err;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return res.json();
    }
    return res.text();
}

export const getTransactions = async () => {
    try {
        const data = await fetchJson('/WeatherForecast', { method: 'GET' });
        return data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
};
export const getUsers = async () => {
    try {
        const data = await fetchJson('/api/UserMaster', { method: 'GET' });
        return data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
};

export const addUser = async (user) => {
    try {
        const data = await fetchJson('/api/UserMaster', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
        return data;
    } catch (error) {
        console.error('Error adding user:', error);
        throw error;
    }
};

export const loginUser = async (credentials) => {
    try {
        const data = await fetchJson('/api/UserMaster/LoginUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        return data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};
