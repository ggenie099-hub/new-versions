import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  console.log('API Request Interceptor - Token:', token ? 'Token exists' : 'No token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Authorization header added:', config.headers.Authorization?.substring(0, 20) + '...');
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (refresh_token: string) =>
    api.post('/auth/refresh', { refresh_token }),
  getCurrentUser: () => api.get('/auth/me'),
  regenerateApiKey: () => api.post('/auth/regenerate-api-key'),
};

// MT5 APIs
export const mt5API = {
  getAccounts: () => api.get('/mt5/accounts'),
  createAccount: (data: any) => api.post('/mt5/accounts', data),
  getAccount: (id: number) => api.get(`/mt5/accounts/${id}`),
  connectAccount: (id: number) => api.post(`/mt5/accounts/${id}/connect`),
  disconnectAccount: (id: number) => api.post(`/mt5/accounts/${id}/disconnect`),
  syncAccount: (id: number) => api.post(`/mt5/accounts/${id}/sync`),
  deleteAccount: (id: number) => api.delete(`/mt5/accounts/${id}`),
};

// Trade APIs
export const tradeAPI = {
  getTrades: (status?: string) => api.get('/trades', { params: { status_filter: status } }),
  getOpenTrades: () => api.get('/trades/open'),
  getTrade: (id: number) => api.get(`/trades/${id}`),
  createTrade: (accountId: number, data: any) =>
    api.post('/trades', data, { params: { account_id: accountId } }),
  closeTrade: (id: number) => api.post(`/trades/${id}/close`),
  syncPositions: (accountId: number) =>
    api.post('/trades/sync-positions', null, { params: { account_id: accountId } }),
};

// Symbol APIs
export const symbolAPI = {
  search: (query: string) => api.get('/symbols/search', { params: { query } }),
  getAll: () => api.get('/symbols/all'),
  getInfo: (symbol: string) => api.get(`/symbols/${symbol}/info`),
  generateJSON: (data: any) => api.post('/symbols/generate-json', null, { params: data }),
  getTemplate: () => api.get('/symbols/generate-json/template'),
};

// Watchlist APIs
export const watchlistAPI = {
  getWatchlist: () => api.get('/watchlist'),
  addToWatchlist: (symbol: string) => api.post('/watchlist', { symbol }),
  removeFromWatchlist: (id: number) => api.delete(`/watchlist/${id}`),
  syncWatchlist: () => api.post('/watchlist/sync'),
};

// Notification APIs
export const notificationAPI = {
  getNotifications: (unreadOnly?: boolean, limit?: number) =>
    api.get('/notifications', { params: { unread_only: unreadOnly, limit } }),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  deleteNotification: (id: number) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
};
