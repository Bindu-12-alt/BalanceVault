import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// --- Request interceptor: attach JWT ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: handle 401 & refresh ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const newToken = res.data.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// ---- Onboarding ----
export const onboardingAPI = {
  submit: (data) => api.post('/onboarding/submit', data),
  status: () => api.get('/onboarding/status'),
};

// ---- Accounts ----
export const accountsAPI = {
  create: (data) => api.post('/accounts', data),
  list: () => api.get('/accounts'),
  get: (id) => api.get(`/accounts/${id}`),
  transactions: (id, params) => api.get(`/accounts/${id}/transactions`, { params }),
};

// ---- Transfers ----
export const transfersAPI = {
  initiate: (data) => api.post('/transfers', data),
  get: (id) => api.get(`/transfers/${id}`),
};

// ---- Admin ----
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: (params) => api.get('/admin/users', { params }),
  user: (id) => api.get(`/admin/users/${id}`),
  setUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  onboarding: (params) => api.get('/admin/onboarding', { params }),
  onboardingById: (id) => api.get(`/admin/onboarding/${id}`),
  reviewOnboarding: (id, data) => api.patch(`/admin/onboarding/${id}/review`, data),
  accounts: (params) => api.get('/admin/accounts', { params }),
  updateAccountStatus: (id, status) => api.patch(`/admin/accounts/${id}/status`, { status }),
  transactions: (params) => api.get('/admin/transactions', { params }),
  auditLogs: (params) => api.get('/admin/audit-logs', { params }),
  verifyLedger: () => api.get('/admin/ledger/verify'),
};

export default api;
