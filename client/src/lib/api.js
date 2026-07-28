import axios from 'axios';

const API_URL = import.meta.env.PROD
  ? 'https://paginaweb-l5qe.onrender.com/api'
  : '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default api;

export const productsApi = {
  getAll: (params) => api.get('/products', { params }).then(r => r.data),
  getById: (id) => api.get(`/products/${id}`).then(r => r.data),
  create: (data) => api.post('/products', data).then(r => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/products/${id}`).then(r => r.data),
  addCompatibility: (id, data) => api.post(`/products/${id}/compatibility`, data).then(r => r.data),
  removeCompatibility: (id, compId) => api.delete(`/products/${id}/compatibility/${compId}`).then(r => r.data),
};

export const inventoryApi = {
  getAll: () => api.get('/inventory').then(r => r.data),
  getAlerts: () => api.get('/inventory/alerts').then(r => r.data),
  stockIn: (data) => api.post('/inventory/in', data).then(r => r.data),
  stockOut: (data) => api.post('/inventory/out', data).then(r => r.data),
  adjust: (data) => api.post('/inventory/adjust', data).then(r => r.data),
  getHistory: (params) => api.get('/inventory/history', { params }).then(r => r.data),
};

export const ordersApi = {
  getAll: (params) => api.get('/orders', { params }).then(r => r.data),
  getById: (id) => api.get(`/orders/${id}`).then(r => r.data),
  create: (data) => api.post('/orders', data).then(r => r.data),
  update: (id, data) => api.put(`/orders/${id}`, data).then(r => r.data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }).then(r => r.data),
  getTodayStats: () => api.get('/orders/stats/today').then(r => r.data),
  getRecent: (limit) => api.get('/orders/recent', { params: { limit } }).then(r => r.data),
};

export const customersApi = {
  getAll: (params) => api.get('/customers', { params }).then(r => r.data),
  getById: (id) => api.get(`/customers/${id}`).then(r => r.data),
  create: (data) => api.post('/customers', data).then(r => r.data),
  update: (id, data) => api.put(`/customers/${id}`, data).then(r => r.data),
};

export const messagesApi = {
  getAll: (params) => api.get('/messages', { params }).then(r => r.data),
  getConversation: (phone) => api.get(`/messages/${phone}`).then(r => r.data),
  send: (data) => api.post('/messages/send', data).then(r => r.data),
  getUnreadCount: () => api.get('/messages/unread-count').then(r => r.data),
  getTransfers: () => api.get('/messages/transfers').then(r => r.data),
  resolveTransfer: (id) => api.put(`/messages/transfers/${id}/resolve`).then(r => r.data),
};

export const settingsApi = {
  get: () => api.get('/settings').then(r => r.data),
  update: (data) => api.put('/settings', data).then(r => r.data),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
};

export const webhookApi = {
  getStatus: () => api.get('/webhook/webhook-status').then(r => r.data),
  test: (phone) => api.post('/webhook/webhook-test', { phone }).then(r => r.data),
};
