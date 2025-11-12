const axios = require('axios');

const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Caché en memoria para datos del clima
const weatherCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

const weatherService = {
  getWeatherData: async (city, countryCode = null) => {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key no configurada en las variables de entorno.');
    }

    // Simple translation for common city names
    let translatedCity = city.toLowerCase();
    switch (translatedCity) {
      case 'londres':
        translatedCity = 'london';
        break;
      case 'parís':
        translatedCity = 'paris';
        break;
      case 'nueva york':
        translatedCity = 'new york';
        break;
      case 'tokio':
        translatedCity = 'tokyo';
        break;
      case 'roma':
        translatedCity = 'rome';
        break;
      // Add more translations as needed
      default:
        // No translation needed
        break;
    }

    const cacheKey = `${translatedCity}-${countryCode}`;
    const now = Date.now();

    // Verificar si los datos están en caché y aún son válidos
    if (weatherCache[cacheKey] && (now - weatherCache[cacheKey].timestamp < CACHE_DURATION)) {
      console.log(`✅ Datos del clima para ${translatedCity} obtenidos de la caché.`);
      return weatherCache[cacheKey].data;
    }

    const url = `${WEATHER_API_BASE_URL}/weather?q=${translatedCity}${countryCode ? `,${countryCode}` : ''}&appid=${apiKey}&units=metric&lang=es`;
    
    console.log(`🔑 Usando API Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'No configurada'}`);
    console.log(`🌐 Solicitando a URL: ${url}`);

    try {
      console.log(`🔍 Solicitando datos del clima para ${translatedCity} a OpenWeatherMap...`);
      const response = await axios.get(url);
      
      // Almacenar en caché
      weatherCache[cacheKey] = {
        data: response.data,
        timestamp: now,
      };
      console.log(`💾 Datos del clima para ${translatedCity} almacenados en caché.`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al obtener datos del clima para ${translatedCity}:`, error.message);
      if (error.response) {
        console.error('Respuesta de error de la API:', error.response.data);
        // Manejo específico para 401 (API Key inválida) o 404 (Ciudad no encontrada)
        if (error.response.status === 401) {
          throw new Error('API Key de OpenWeatherMap inválida o no autorizada.');
        } else if (error.response.status === 404) {
          throw new Error(`Ciudad '${translatedCity}' no encontrada por la API del clima.`);
        } else if (error.response.status === 429) {
          throw new Error('Límite de llamadas a la API de OpenWeatherMap excedido. Inténtalo de nuevo más tarde.');
        }
        throw new Error(`Error de la API del clima: ${error.response.data.message || error.response.status}`);
      } else if (error.request) {
        throw new Error('No se recibió respuesta de la API del clima. Verifica tu conexión a internet o la disponibilidad de OpenWeatherMap.');
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
