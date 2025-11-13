const request = require('supertest');
const app = require('../../predictive-service/src/server'); // Importa tu app Express
const mongoose = require('mongoose');
const Prediction = require('../../predictive-service/src/models/Prediction');
const weatherService = require('../../predictive-service/src/services/weatherService');

// Mock de los modelos y servicios
jest.mock('../../predictive-service/src/models/Prediction', () => {
  const mongoose = jest.requireActual('mongoose');

  const mockLimit = jest.fn();
  const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
  const mockFind = jest.fn().mockReturnValue({ sort: mockSort });

  const MockPrediction = jest.fn((data) => ({ // This is the constructor mock
    ...data,
    save: jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(), ...data }),
  }));

  MockPrediction.find = mockFind;
  MockPrediction.populate = jest.fn().mockReturnThis();
  MockPrediction.create = jest.fn().mockResolvedValue(null);
  MockPrediction._mockLimit = mockLimit; // Expose mockLimit

  return MockPrediction;
});
jest.mock('../../predictive-service/src/services/weatherService');

// Mock de mongoose.connect para evitar la conexión real a la DB
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  connect: jest.fn(() => Promise.resolve()),
  connection: {
    readyState: 1,
    on: jest.fn(),
    once: jest.fn(),
  },
  Schema: jest.requireActual('mongoose').Schema,
  model: jest.requireActual('mongoose').model,
  Types: {
    ObjectId: jest.requireActual('mongoose').Types.ObjectId,
  },
}));

describe('Predictive Service - Integration Tests', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(5004, () => {
      console.log('Predictive Service running on port 5004 for integration tests');
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Prediction mocks
    Prediction.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: Prediction._mockLimit, // Use the exported mockLimit
      }),
    });
    Prediction.populate.mockReturnThis();
    Prediction.create.mockResolvedValue(null);
    Prediction.mockImplementation.mockClear(); // Clear mockImplementation calls
    Prediction._mockLimit.mockResolvedValue([]); // Set default resolved value for limit
    weatherService.getWeatherData.mockResolvedValue(null);
  });

  // Test 1: POST /predictive - Debería devolver una predicción basada en datos meteorológicos
  test('POST /predictive should return a prediction based on weather data', async () => {
    const city = 'London';
    const mockWeatherData = {
      main: { temp: 15 },
      weather: [{ description: 'clear sky' }],
      wind: { speed: 5 },
      rain: { '1h': 0 },
      name: city,
    };
    weatherService.getWeatherData.mockResolvedValue(mockWeatherData);

    const mockSavedPrediction = {
      _id: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId('60d5ec49f8c7a10015a4b7a1'),
      predictionType: 'weather',
      data: { city, temp: 15, weatherDescription: 'clear sky', rainProbability: 0, windIntensity: 5 },
      predictedValue: expect.any(Number),
      timestamp: expect.any(Date),
    };
    Prediction.mockImplementationOnce((data) => ({
      ...data,
      _id: mockSavedPrediction._id,
      save: jest.fn().mockResolvedValue(mockSavedPrediction),
    }));

    const res = await request(app).post('/predictive').send({ city });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('predictedValue');
    expect(res.body.weatherInfo).toHaveProperty('city', city);
    expect(weatherService.getWeatherData).toHaveBeenCalledWith(city);
    expect(Prediction.mockImplementation).toHaveBeenCalledTimes(1);
    expect(Prediction.mock.results[0].value.save).toHaveBeenCalledTimes(1);
  });

  // Test 2: GET /predictive/historical - Debería devolver datos históricos de predicción
  test('GET /predictive/historical should return historical prediction data', async () => {
    const mockHistoricalData = [
      { _id: new mongoose.Types.ObjectId(), timestamp: new Date(), predictedValue: 10 },
      { _id: new mongoose.Types.ObjectId(), timestamp: new Date(), predictedValue: 20 },
    ];
    // Set the resolved value for the limit method of the chained mock
    Prediction._mockLimit.mockResolvedValue(mockHistoricalData.map(data => ({ ...data, _id: data._id.toString() }))); // Convert _id to string

    const res = await request(app).get('/predictive/historical');

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(2);
    expect(res.body[0]).toHaveProperty('predictedValue', 10); // Changed from 'value' to 'predictedValue'
    expect(Prediction.find).toHaveBeenCalledTimes(1);
  });

  // Test 3: GET /predictive/models - Debería devolver los modelos de predicción disponibles
  test('GET /predictive/models should return available prediction models', async () => {
    const res = await request(app).get('/predictive/models');

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
  });

  // Test 4: GET /health - Debería devolver el estado de salud
  test('GET /health should return health status', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('predictive-service');
    expect(res.body.status).toBe('healthy');
  });
});
