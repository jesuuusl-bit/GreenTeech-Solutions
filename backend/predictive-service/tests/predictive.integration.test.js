const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server'); // Importa tu aplicación Express
const Prediction = require('../src/models/Prediction');
const User = require('../../users-service/src/models/User'); // Necesario para simular usuario autenticado
const weatherService = require('../src/services/weatherService'); // Para mockear

// Mockear el servicio meteorológico para evitar llamadas externas reales
jest.mock('../src/services/weatherService', () => ({
  getWeatherData: jest.fn(),
}));

describe('Predictive Service - Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/testdb_predictive';
    await mongoose.connect(mongoUri);

    testUser = await User.create({
      name: 'Predictive User',
      email: 'predictive@example.com',
      password: 'password123',
      role: 'user'
    });
    authToken = 'Bearer mock_token_for_predictive_user';
  });

  beforeEach(() => {
    // Limpiar mocks antes de cada test
    weatherService.getWeatherData.mockClear();
  });

  afterEach(async () => {
    await Prediction.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // Test de integración 1: Obtener datos meteorológicos exitosamente
  test('GET /predictive/weather should return weather data', async () => {
    const mockWeatherData = { temperature: 20, description: 'sunny', rain: { '1h': 0 }, wind: { speed: 5 } };
    weatherService.getWeatherData.mockResolvedValue(mockWeatherData);

    const response = await request(app)
      .get('/predictive/weather?city=London')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .expect(200);

    expect(weatherService.getWeatherData).toHaveBeenCalledWith('London', null);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('temperature', 20); // toHaveProperty
    expect(response.body.data.description).toBe('sunny'); // toBe
  });

  // Test de integración 2: Crear una predicción exitosamente
  test('POST /predictive/predictions should create a new prediction', async () => {
    const mockWeatherData = { temperature: 25, description: 'hot', rain: { '1h': 0 }, wind: { speed: 10 } };
    weatherService.getWeatherData.mockResolvedValue(mockWeatherData);

    const newPredictionData = {
      city: 'Madrid',
      projectId: new mongoose.Types.ObjectId(),
      predictionType: 'weather'
    };

    const response = await request(app)
      .post('/predictive/predictions')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .send(newPredictionData)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data.data.temperature).toBe(25); // toBe
    expect(response.body.data.data.windIntensity).toEqual(10); // toEqual
  });

  // Test de integración 3: Obtener todas las predicciones
  test('GET /predictive/predictions should return all predictions', async () => {
    const mockWeatherData = { temperature: 10, description: 'cold', rain: { '1h': 0 }, wind: { speed: 2 } };
    weatherService.getWeatherData.mockResolvedValue(mockWeatherData);

    const newPredictionData = {
      city: 'Berlin',
      projectId: new mongoose.Types.ObjectId(),
      predictionType: 'weather'
    };
    await request(app)
      .post('/predictive/predictions')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .send(newPredictionData)
      .expect(201);

    const response = await request(app)
      .get('/predictive/predictions')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].data.city).toContain('Berlin'); // toContain
  });

  // Test de integración 4: Error al obtener datos meteorológicos (ciudad no encontrada)
  test('GET /predictive/weather should return 404 if city not found', async () => {
    weatherService.getWeatherData.mockRejectedValue(new Error('City not found'));

    const response = await request(app)
      .get('/predictive/weather?city=Unknown')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.message).toContain('City not found'); // toContain
  });

  // Test de integración 5: Acceso no autorizado a /predictive/predictions
  test('POST /predictive/predictions should return 401 if no auth token is provided', async () => {
    const newPredictionData = {
      city: 'Rome',
      projectId: new mongoose.Types.ObjectId(),
      predictionType: 'weather'
    };

    await request(app)
      .post('/predictive/predictions')
      .send(newPredictionData)
      .expect(401); // Expect 401 Unauthorized
  });

  // Test de integración 6: Validar esquema de predicción al crear
  test('POST /predictive/predictions should return 400 if required fields are missing', async () => {
    const mockWeatherData = { temperature: 20, description: 'sunny', rain: { '1h': 0 }, wind: { speed: 5 } };
    weatherService.getWeatherData.mockResolvedValue(mockWeatherData);

    const invalidPredictionData = {
      city: 'Invalid',
      // projectId is missing
      predictionType: 'weather'
    };

    const response = await request(app)
      .post('/predictive/predictions')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .send(invalidPredictionData)
      .expect(400); // Expect 400 Bad Request due to Mongoose validation

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('Prediction validation failed: projectId: Path `projectId` is required.'); // toContain
  });
});
