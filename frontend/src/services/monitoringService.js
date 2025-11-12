import api from './api';

export const monitoringService = {
  getCurrentProduction: async (plantId = null) => {
    const params = plantId ? { plantId } : {};
    const response = await api.get('/monitoring/production/current', { params });
    return response.data;
  },

  getHistoricalData: async (plantId, startDate, endDate) => {
    const response = await api.get('/monitoring/production/historical', {
      params: { plantId, startDate, endDate }
    });
    return response.data;
  },

  createProductionData: async (data) => {
    const response = await api.post('/monitoring/production', data);
    return response.data;
  },

  updateProductionData: async (id, data) => {
    const response = await api.patch(`/monitoring/production/${id}`, data);
    return response.data;
  },

  getAlerts: async (filters = {}) => {
    const response = await api.get('/monitoring/alerts', { params: filters });
    return response.data;
  },



  acknowledgeAlert: async (id, userId, userName) => {
    const response = await api.patch(`/monitoring/alerts/${id}/acknowledge`, {
      userId,
      userName
    });
    return response.data;
  },

  resolveAlert: async (id, userId, userName, resolution) => {
    const response = await api.patch(`/monitoring/alerts/${id}/resolve`, {
      userId,
      userName,
      resolution
    });
    return response.data;
  }
};