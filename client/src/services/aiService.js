import api from './api';

export const aiService = {
  analyze: (repositoryId) => api.post('/ai/analyze', { repositoryId }),
  chat: (repositoryId, prompt) => api.post('/ai/chat', { repositoryId, prompt }),
  suggestions: (repositoryId) => api.post('/ai/suggestions', { repositoryId }),
  generateFeature: (repositoryId, prompt) =>
    api.post('/ai/generate-feature', { repositoryId, prompt }),
};
