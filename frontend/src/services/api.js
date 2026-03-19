import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.join(', ') ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ─── Workflows ───────────────────────────────────────────────────────────────
export const workflowApi = {
  getAll: (params) => api.get('/workflows', { params }),
  getById: (id) => api.get(`/workflows/${id}`),
  create: (data) => api.post('/workflows', data),
  update: (id, data) => api.put(`/workflows/${id}`, data),
  delete: (id) => api.delete(`/workflows/${id}`),
  execute: (id, data) => api.post(`/workflows/${id}/execute`, data),
  simulate: (id, data) => api.post(`/workflows/${id}/simulate`, data),
  predict: (id, data) => api.post(`/workflows/${id}/predict`, data),
};

// ─── Steps ───────────────────────────────────────────────────────────────────
export const stepApi = {
  getByWorkflow: (workflowId) => api.get(`/workflows/${workflowId}/steps`),
  create: (workflowId, data) => api.post(`/workflows/${workflowId}/steps`, data),
  update: (id, data) => api.put(`/steps/${id}`, data),
  delete: (id) => api.delete(`/steps/${id}`),
  setStart: (workflowId, startStepId) =>
    api.put(`/workflows/${workflowId}/steps/start`, { startStepId }),
  reorder: (steps) => api.put('/steps/reorder', { steps }),
};

// ─── Rules ───────────────────────────────────────────────────────────────────
export const ruleApi = {
  getByStep: (stepId) => api.get(`/steps/${stepId}/rules`),
  create: (stepId, data) => api.post(`/steps/${stepId}/rules`, data),
  update: (id, data) => api.put(`/rules/${id}`, data),
  delete: (id) => api.delete(`/rules/${id}`),
  reorder: (rules) => api.put('/rules/reorder', { rules }),
};

// ─── Executions ──────────────────────────────────────────────────────────────
export const executionAPI = {
  list: (params) => api.get('/executions', { params }),
  get: (id) => api.get(`/executions/${id}`),
  cancel: (id) => api.post(`/executions/${id}/cancel`),
  retry: (id) => api.post(`/executions/${id}/retry`),
  approve: (id, approverId) => api.post(`/executions/${id}/approve`, { approverId }),
  reject: (id, approverId) => api.post(`/executions/${id}/reject`, { approverId }),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// ─── AI ──────────────────────────────────────────────────────────────────────
export const aiAPI = {
  generate: (description) => api.post('/ai/generate', { description }),
  create: (description) => api.post('/ai/create', { description }),
  getTemplates: () => api.get('/ai/templates'),
  createFromTemplate: (key) => api.post(`/ai/templates/${key}/create`),
  analyzeExecution: (id) => api.post(`/ai/analyze/${id}`),
  generateRCA: (id) => api.post(`/ai/rca/${id}`),
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export default api;
