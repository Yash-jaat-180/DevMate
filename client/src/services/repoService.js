import api from './api';

export const repoService = {
  importRepo: (repoUrl) => api.post('/repositories/import', { repoUrl }),
  getAll: () => api.get('/repositories'),
  getById: (id) => api.get(`/repositories/${id}`),
  getTree: (id) => api.get(`/repositories/${id}/tree`),
  getFile: (id, path) => api.get(`/repositories/${id}/file`, { params: { path } }),
  delete: (id) => api.delete(`/repositories/${id}`),
};
