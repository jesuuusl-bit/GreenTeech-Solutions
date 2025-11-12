const Prediction = require('../models/Prediction');
const weatherService = require('../services/weatherService');
const { Regression } = require('ml-regression'); // Asumiendo que usas ml-regression

// Controlador para obtener una predicción
exports.getPrediction = async (req, res) => {
  const { feature1, feature2, city } = req.body; // Añadimos 'city' como parámetro de entrada

  if (feature1 === undefined || feature2 === undefined) {
    return res.status(400).json({ message: 'Se requieren feature1 y feature2 para la predicción.' });
  }

  try {
    let weatherData = null;
    if (city) {
      // Obtener datos del clima si se proporciona una ciudad
      weatherData = await weatherService.getWeatherData(city);
      console.log('Datos del clima obtenidos:', weatherData);
      // Aquí puedes extraer las características del clima que sean relevantes
      // Por ejemplo: temperatura, humedad, velocidad del viento, etc.
      // Para este ejemplo, solo usaremos la temperatura
    }

    // Lógica de predicción (ejemplo simplificado)
    // En un caso real, aquí integrarías tu modelo de ml-regression o simple-statistics
    // y usarías las características del clima como entrada si están disponibles.

    let predictedValue;
    if (weatherData && weatherData.main && weatherData.main.temp) {
      // Ejemplo: la predicción se ve afectada por la temperatura
      predictedValue = (feature1 * 0.5) + (feature2 * 0.3) + (weatherData.main.temp * 0.2);
    } else {
      predictedValue = (feature1 * 0.6) + (feature2 * 0.4);
    }

    // Guardar la predicción (opcional, si quieres mantener un historial)
    const newPrediction = new Prediction({
      inputFeatures: { feature1, feature2, city },
      predictedValue: predictedValue,
      timestamp: new Date(),
    });
    await newPrediction.save();

    res.status(200).json({
      predictedValue: predictedValue,
      weatherInfo: weatherData ? {
        temp: weatherData.main.temp,
        description: weatherData.weather[0].description,
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
