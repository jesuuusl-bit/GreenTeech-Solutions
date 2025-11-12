import api from './api';

const predictiveService = {
  // Obtener una predicción basada en ciertos parámetros
  getPrediction: async (predictionData) => {
    try {
      console.log('🔮 Requesting prediction with data:', predictionData);
      const response = await api.post('/predictive/predict', predictionData);
      console.log('✅ Prediction received successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting prediction:', error);
      throw error;
    }
  },

  // Obtener datos históricos para análisis predictivo
  getHistoricalData: async (params) => {
    try {
      console.log('📈 Fetching historical data with params:', params);
      const response = await api.get('/predictive/history', { params });
      console.log('✅ Historical data fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching historical data:', error);
      throw error;
    }
  },

  // Obtener modelos predictivos disponibles
  getPredictionModels: async () => {
    try {
      console.log('🧠 Fetching available prediction models...');
      const response = await api.get('/predictive/models');
      console.log('✅ Prediction models fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching prediction models:', error);
      throw error;
    }
  },
};

export default predictiveService;
