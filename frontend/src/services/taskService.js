// ===== frontend/src/services/taskService.js =====
import api from './api';

export const taskService = {
  getByProject: async (projectId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/tasks/project/${projectId}?${params}`);
    return response.data;
  },

  create: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  update: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  addComment: async (id, commentData) => {
    const response = await api.post(`/tasks/${id}/comments`, commentData);
    return response.data;
  }
};
