const Prediction = require('../models/Prediction');
const weatherService = require('../services/weatherService');
const { Regression } = require('ml-regression'); // Asumiendo que usas ml-regression

// Controlador para obtener una predicción
exports.getPrediction = async (req, res) => {
  const { city } = req.body;

  if (!city) {
    return res.status(400).json({ message: 'Se requiere la ciudad para la predicción.' });
  }

  try {
    let weatherData = null;
    let temp = 0;
    let weatherDescription = 'Desconocido';
    let rainProbability = 0; // Default to 0
    let windIntensity = 0;   // Default to 0

    weatherData = await weatherService.getWeatherData(city);
    console.log('Datos del clima obtenidos:', weatherData);

    if (weatherData) {
      if (weatherData.main && weatherData.main.temp) {
        temp = weatherData.main.temp;
      }
      if (weatherData.weather && weatherData.weather[0] && weatherData.weather[0].description) {
        weatherDescription = weatherData.weather[0].description;
      }
      if (weatherData.wind && weatherData.wind.speed) {
        windIntensity = weatherData.wind.speed;
      }
      // Derive rainProbability from rain.1h if available
      if (weatherData.rain && weatherData.rain['1h'] > 0) {
        rainProbability = 0.8; // Simple proxy: if it's raining, set a high probability
      }
    }

    // Lógica de predicción mejorada con datos meteorológicos
    // Esta es una fórmula de ejemplo. En un caso real, usarías tu modelo de ML.
    // Ejemplo: Un valor predictivo que aumenta con la temperatura y el viento,
    // y disminuye con la probabilidad de lluvia.
    let predictedValue = (temp * 0.5) + (windIntensity * 1.2) - (rainProbability * 0.8);

    // Asegurarse de que el valor no sea negativo si no tiene sentido para tu predicción
    predictedValue = Math.max(0, predictedValue);

    // Guardar la predicción (opcional, si quieres mantener un historial)
    const newPrediction = new Prediction({
      inputFeatures: { city, temp, weatherDescription, rainProbability, windIntensity },
      predictedValue: predictedValue,
      timestamp: new Date(),
    });
    await newPrediction.save();

    res.status(200).json({
      predictedValue: predictedValue,
      weatherInfo: weatherData ? {
        temp: temp,
        description: weatherDescription,
        city: weatherData.name,
      } : undefined,
      message: 'Predicción generada exitosamente.'
    });

  } catch (error) {
    console.error('Error en la predicción:', error);
    res.status(500).json({ message: 'Error al generar la predicción', error: error.message });
  }
};

// Controlador para obtener datos históricos (ejemplo)
exports.getHistoricalData = async (req, res) => {
  try {
    const historicalData = await Prediction.find().sort({ timestamp: -1 }).limit(10);
    // Formatear para el frontend si es necesario
    const formattedData = historicalData.map(data => ({
      name: new Date(data.timestamp).toLocaleDateString(),
      value: data.predictedValue,
    }));
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error al obtener datos históricos:', error);
    res.status(500).json({ message: 'Error al obtener datos históricos', error: error.message });
  }
};

// Controlador para obtener modelos predictivos (ejemplo)
exports.getPredictionModels = async (req, res) => {
  try {
    // En un caso real, aquí listarías los modelos de ML disponibles
    const models = [
      { id: 'model-1', name: 'Modelo de Regresión Lineal', description: 'Predicción basada en factores X e Y' },
      { id: 'model-2', name: 'Modelo de Series Temporales', description: 'Predicción basada en datos históricos' },
    ];
    res.status(200).json(models);
  } catch (error) {
    console.error('Error al obtener modelos predictivos:', error);
    res.status(500).json({ message: 'Error al obtener modelos predictivos', error: error.message });
  }
};
