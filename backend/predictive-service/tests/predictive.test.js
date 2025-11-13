const predictiveController = require('../src/controllers/predictiveController');
const Prediction = require('../src/models/Prediction');
const weatherService = require('../src/services/weatherService');
const mongoose = require('mongoose'); // Re-add global import

// Mock de los modelos y servicios
jest.mock('../src/models/Prediction', () => {
  const mongoose = require('mongoose'); // Import mongoose inside the mock factory
  return {
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue([]),
    mockImplementation: jest.fn((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(), ...data }),
    })),
  };
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

  // Test para getWeatherData (del controlador, que usa el servicio)
  test('getWeatherData should return weather data for a city', async () => {
    req.query = { city: 'London' };
    const mockWeatherData = { temperature: 15, description: 'clear sky' };
    weatherService.getWeatherData.mockResolvedValue(mockWeatherData);

    await predictiveController.getWeatherData(req, res);

    expect(weatherService.getWeatherData).toHaveBeenCalledWith('London', null); // toBe
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockWeatherData,
    }));
    expect(res.json.mock.calls[0][0].data).toHaveProperty('temperature', 15); // toHaveProperty
  });

  // Test para getWeatherData con error
  test('getWeatherData should return 404 if city not found', async () => {
    req.query = { city: 'NonExistentCity' };
    weatherService.getWeatherData.mockRejectedValue(new Error('City not found'));

    await predictiveController.getWeatherData(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('City not found'),
    })); // toContain
  });

  // Test para createPrediction
  test('createPrediction should create a new prediction', async () => {
    req.body = {
      city: 'Paris',
      projectId: new mongoose.Types.ObjectId(),
      predictionType: 'weather'
    };
    const mockWeatherData = { temperature: 20, description: 'sunny', rain: { '1h': 0 }, wind: { speed: 5 } };
    weatherService.getWeatherData.mockResolvedValue(mockWeatherData);

    const mockSavedPrediction = { _id: new mongoose.Types.ObjectId(), ...req.body, data: { temperature: 20 } };
    Prediction.mockImplementationOnce(() => ({
      ...req.body,
      data: { temperature: 20, description: 'sunny', rainProbability: 0, windIntensity: 5 },
      save: jest.fn().mockResolvedValue(mockSavedPrediction),
    }));

    await predictiveController.createPrediction(req, res);

    expect(weatherService.getWeatherData).toHaveBeenCalledWith('Paris', null);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        predictionType: 'weather',
        data: expect.objectContaining({ temperature: 20 }),
      }),
    }));
    expect(res.json.mock.calls[0][0].data.data.description).toEqual('sunny'); // toEqual
  });

  // Test para getPredictions
  test('getPredictions should return all predictions', async () => {
    const mockPredictions = [{ predictionType: 'weather', data: { city: 'Rome' }, _id: new mongoose.Types.ObjectId() }];
    Prediction.find.mockReturnThis();
    Prediction.sort.mockResolvedValue(mockPredictions);

    await predictiveController.getPredictions(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({ predictionType: 'weather' }),
      ]),
    }));
    expect(res.json.mock.calls[0][0].data[0]).toHaveProperty('predictionType', 'weather'); // toHaveProperty
  });

  // Puedes añadir más tests unitarios aquí para la lógica de simulaciones, etc.
});
