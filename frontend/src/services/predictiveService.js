export const predictiveService = {
  getHistoricalData: async (filters = {}) => {
    const response = await api.get('/predictive/historical', { params: filters });
    return response.data;
  },

  uploadHistoricalData: async (data) => {
    const response = await api.post('/predictive/historical', data);
    return response.data;
  },

  createSimulation: async (simulationData) => {
    const response = await api.post('/predictive/simulations', simulationData);
    return response.data;
  },

  getSimulations: async () => {
    const response = await api.get('/predictive/simulations');
    return response.data;
  },

  getPredictions: async (plantId) => {
    const response = await api.get('/predictive/predictions', {
      params: { plantId }
    });
    return response.data;
  }
};