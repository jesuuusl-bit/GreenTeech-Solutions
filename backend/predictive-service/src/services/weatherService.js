const axios = require('axios');

const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

const weatherService = {
  getWeatherData: async (city, countryCode = 'ES') => {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key no configurada en las variables de entorno.');
    }

    const url = `${WEATHER_API_BASE_URL}/weather?q=${city},${countryCode}&appid=${apiKey}&units=metric&lang=es`;
    
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener datos del clima para ${city}:`, error.message);
      if (error.response) {
        console.error('Respuesta de error de la API:', error.response.data);
        throw new Error(`Error de la API del clima: ${error.response.data.message || error.response.status}`);
      } else if (error.request) {
        throw new Error('No se recibió respuesta de la API del clima.');
      } else {
        throw new Error('Error al configurar la solicitud de la API del clima.');
      }
    }
  },

  // Puedes añadir más funciones aquí para pronósticos, datos históricos, etc.
  // Por ejemplo:
  getForecastData: async (city, countryCode = 'ES') => {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key no configurada en las variables de entorno.');
    }

    const url = `${WEATHER_API_BASE_URL}/forecast?q=${city},${countryCode}&appid=${apiKey}&units=metric&lang=es`;
    
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener datos del pronóstico para ${city}:`, error.message);
      if (error.response) {
        throw new Error(`Error de la API del clima (pronóstico): ${error.response.data.message || error.response.status}`);
      } else {
        throw new Error('Error al obtener el pronóstico del clima.');
      }
    }
  }
};

module.exports = weatherService;
