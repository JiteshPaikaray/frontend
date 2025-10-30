const defaultHeaders = {
    'Content-Type': 'application/json'
};

// Use relative paths so Vite dev server can proxy requests to the backend and avoid CORS.
// In production you may switch to an absolute backend URL or set an environment variable.
async function fetchJson(path, options = {}) {
    const url = path.startsWith('/') ? path : `/${path}`;
    const fetchOptions = {
        // Note: avoid credentials here to prevent preflight/CORS complexity during dev proxying.
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

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy calls to the backend to avoid CORS in development
      '/WeatherForecast': {
        target: 'http://localhost:5144',
        changeOrigin: true,
        secure: false,
      },
      '/api/UserMaster': {
        target: 'http://localhost:5144',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

