// ===== frontend/src/services/projectService.js =====
import api from './api';

export const projectService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/projects?${params}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  update: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/projects/stats');
    return response.data;
  },

  getRecentProjects: async (limit = 5) => {
    const response = await api.get(`/projects?sortBy=-createdAt&limit=${limit}`);
    return response.data;
  }
};