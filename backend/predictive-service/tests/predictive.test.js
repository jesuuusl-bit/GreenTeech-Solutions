const predictiveController = require('../src/controllers/predictiveController');
const Prediction = require('../src/models/Prediction');
const weatherService = require('../src/services/weatherService');
const mongoose = require('mongoose'); // Re-add global import

// Mock de los modelos y servicios
jest.mock('../src/models/Prediction', () => {
  const mongoose = require('mongoose');
  const MockPrediction = jest.fn(); // This will be our mock constructor
  
  // Mock static methods
  MockPrediction.find = jest.fn().mockReturnThis();
  MockPrediction.populate = jest.fn().mockReturnThis();
  MockPrediction.sort = jest.fn().mockResolvedValue([]);

  // Default implementation for the constructor
  MockPrediction.mockImplementation((data) => ({
    ...data,
    _id: new mongoose.Types.ObjectId(),
    save: jest.fn().mockResolvedValue(data), // Default save behavior
  }));

  return MockPrediction;
});
jest.mock('../src/services/weatherService');

describe('Predictive Service - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  // Test para getPrediction (del controlador, que usa el servicio)
  test('getPrediction should return weather data for a city', async () => {
    req.body = { city: 'London' }; // getPrediction uses req.body, not req.query
    const mockWeatherData = { temperature: 15, description: 'clear sky', main: { temp: 15 }, weather: [{ description: 'clear sky' }], wind: { speed: 5 } };
    weatherService.getWeatherData.mockResolvedValue(mockWeatherData);

    // Mock the Prediction constructor for this test
    const mockSavedPrediction = { _id: new mongoose.Types.ObjectId(), projectId: new mongoose.Types.ObjectId('60d5ec49f8c7a10015a4b7a1'), predictionType: 'weather', data: { city: 'London', temp: 15, weatherDescription: 'clear sky', rainProbability: 0, windIntensity: 5 }, predictedValue: 15 * 0.5 + 5 * 1.2 - 0 * 0.8 };
    Prediction.mockImplementationOnce((data) => ({
      ...data,
      _id: mockSavedPrediction._id,
      save: jest.fn().mockResolvedValue(mockSavedPrediction),
    }));

    await predictiveController.getPrediction(req, res);

    expect(weatherService.getWeatherData).toHaveBeenCalledWith('London'); // weatherService.getWeatherData only takes city
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      predictedValue: expect.any(Number),
      weatherInfo: expect.objectContaining({ temp: 15 }), // Changed from data to weatherInfo
    }));
    expect(res.json.mock.calls[0][0].weatherInfo).toHaveProperty('description', 'clear sky');
  });

  // Test para getPrediction con error (city not provided)
  test('getPrediction should return 400 if city not provided', async () => {
    req.body = {}; // No city provided
    await predictiveController.getPrediction(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Se requiere la ciudad'),
    }));
  });

  // Test para createPrediction (via getPrediction) should create a new prediction record
  test('createPrediction (via getPrediction) should create a new prediction record', async () => {
    req.body = { city: 'Paris' };
    const mockWeatherData = { temperature: 20, description: 'sunny', main: { temp: 20 }, weather: [{ description: 'sunny' }], wind: { speed: 5 }, rain: { '1h': 0 } };
    weatherService.getWeatherData.mockResolvedValue(mockWeatherData);

    const mockSavedPrediction = { _id: new mongoose.Types.ObjectId(), projectId: new mongoose.Types.ObjectId('60d5ec49f8c7a10015a4b7a1'), predictionType: 'weather', data: { city: 'Paris', temp: 20, weatherDescription: 'sunny', rainProbability: 0, windIntensity: 5 }, predictedValue: expect.any(Number) };
    Prediction.mockImplementationOnce((data) => ({
      ...data,
      _id: mockSavedPrediction._id,
      save: jest.fn().mockResolvedValue(mockSavedPrediction),
    }));

    await predictiveController.getPrediction(req, res); // Call getPrediction

    expect(weatherService.getWeatherData).toHaveBeenCalledWith('Paris');
    expect(res.status).toHaveBeenCalledWith(200); // getPrediction returns 200 on success
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      predictedValue: expect.any(Number),
      weatherInfo: expect.objectContaining({ temp: 20 }),
    }));
    // Verify that Prediction constructor was called and save was called
    expect(Prediction).toHaveBeenCalledTimes(1);
    expect(Prediction.mock.calls[0][0]).toHaveProperty('predictionType', 'weather');
    expect(Prediction.mock.results[0].value.save).toHaveBeenCalledTimes(1);
  });

  // Puedes añadir más tests unitarios aquí para la lógica de simulaciones, etc.
});