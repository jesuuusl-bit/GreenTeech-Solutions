const request = require('supertest');
const app = require('../../monitoring-service/src/server'); // Importa tu app Express
const mongoose = require('mongoose');
const ProductionData = require('../../monitoring-service/src/models/ProductionData');
const Alert = require('../../monitoring-service/src/models/Alert');

// Mock de los modelos
jest.mock('../../monitoring-service/src/models/ProductionData', () => ({
  find: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue([]),
  findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../monitoring-service/src/models/Alert', () => ({
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue(null),
}));

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

describe('Monitoring Service - Integration Tests', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(5003, () => {
      console.log('Monitoring Service running on port 5003 for integration tests');
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    ProductionData.find.mockReturnThis();
    ProductionData.populate.mockReturnThis();
    ProductionData.sort.mockResolvedValue([]);
    ProductionData.findByIdAndUpdate.mockResolvedValue(null);
    ProductionData.create.mockResolvedValue(null);
    Alert.find.mockReturnThis();
    Alert.sort.mockResolvedValue([]);
    Alert.create.mockResolvedValue(null);
  });

  // Test 1: GET /monitoring - Debería devolver una lista de datos de producción
  test('GET /monitoring should return a list of production data', async () => {
    const mockData = [
      { _id: new mongoose.Types.ObjectId(), plantId: 'plantA', efficiency: 85, value: 1000 },
      { _id: new mongoose.Types.ObjectId(), plantId: 'plantB', efficiency: 90, value: 1200 },
    ];
    ProductionData.find.mockReturnThis();
    ProductionData.populate.mockReturnThis();
    ProductionData.sort.mockResolvedValue(mockData);

    const res = await request(app).get('/monitoring/production/current');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockData);
    expect(ProductionData.find).toHaveBeenCalledTimes(1);
  });

  // Test 2: POST /monitoring - Debería crear nuevos datos de producción y una alerta si la eficiencia es baja
  test('POST /monitoring should create new production data and a medium alert if efficiency is low', async () => {
    const newData = { plantId: 'plantC', efficiency: 60, value: 800 };
    const mockSavedData = { _id: new mongoose.Types.ObjectId(), ...newData };
    ProductionData.create.mockResolvedValue(mockSavedData);
    Alert.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId(), type: 'low-production', severity: 'medium' });

    const res = await request(app).post('/monitoring/production').send(newData);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockSavedData);
    expect(ProductionData.create).toHaveBeenCalledWith(newData);
    expect(Alert.create).toHaveBeenCalledWith(expect.objectContaining({
      type: 'low-production',
      severity: 'medium',
      plantId: 'plantC',
    }));
  });

  // Test 3: PUT /monitoring/:id - Debería actualizar datos de producción existentes
  test('PUT /monitoring/:id should update existing production data', async () => {
    const dataId = new mongoose.Types.ObjectId();
    const updatedData = { efficiency: 95 };
    const mockUpdatedData = { _id: dataId, plantId: 'plantA', efficiency: 95, value: 1000 };
    ProductionData.findByIdAndUpdate.mockResolvedValue(mockUpdatedData);

    const res = await request(app).patch(`/monitoring/production/${dataId}`).send(updatedData);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockUpdatedData);
    expect(ProductionData.findByIdAndUpdate).toHaveBeenCalledWith(dataId.toString(), updatedData, { new: true, runValidators: true });
  });

  // Test 4: GET /alerts - Debería devolver una lista de alertas
  test('GET /alerts should return a list of alerts', async () => {
    const mockAlerts = [
      { _id: new mongoose.Types.ObjectId(), type: 'low-production', severity: 'high', plantId: 'plantA' },
      { _id: new mongoose.Types.ObjectId(), type: 'maintenance', severity: 'low', plantId: 'plantB' },
    ];
    Alert.find.mockReturnThis();
    Alert.sort.mockResolvedValue(mockAlerts);

    const res = await request(app).get('/monitoring/alerts');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockAlerts);
    expect(Alert.find).toHaveBeenCalledTimes(1);
  });

  // Test 5: GET /health - Debería devolver el estado de salud
  test('GET /health should return health status', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('monitoring-service');
    expect(res.body.status).toBe('healthy');
  });
});
