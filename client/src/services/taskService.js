import api from './api';

export const taskService = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  delete: (id) => api.delete(`/tasks/${id}`),
};
