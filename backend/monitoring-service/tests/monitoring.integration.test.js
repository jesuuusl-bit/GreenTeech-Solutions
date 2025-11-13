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
  aggregate: jest.fn().mockResolvedValue([]), // Added aggregate mock
}));
jest.mock('../../monitoring-service/src/models/Alert', () => {
  const mockLimit = jest.fn();
  const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
  const mockFind = jest.fn().mockReturnValue({ sort: mockSort });

  return {
    find: mockFind,
    create: jest.fn(),
    _mockLimit: mockLimit, // Export mockLimit
  };
});

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
    // Mock for aggregate to return sample data for getCurrentProduction
    ProductionData.aggregate.mockResolvedValue([
      { _id: 'plantA', plantId: 'plantA', production: { current: 100, capacity: 120 }, efficiency: 83.33 },
      { _id: 'plantB', plantId: 'plantB', production: { current: 150, capacity: 200 }, efficiency: 75.00 },
    ]);
    // Reset Alert mocks with explicit chaining
    Alert.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: Alert._mockLimit, // Use the exported mockLimit
      }),
    });
    Alert.create.mockResolvedValue(null);
    Alert._mockLimit.mockResolvedValue([]); // Set default resolved value
  });

  // Test 1: GET /monitoring should return a list of production data
  test('GET /monitoring should return a list of production data', async () => {
    const mockAggregatedData = [
      { _id: 'plantA', plantId: 'plantA', production: { current: 100, capacity: 120 }, efficiency: 83.33 },
      { _id: 'plantB', plantId: 'plantB', production: { current: 150, capacity: 200 }, efficiency: 75.00 },
    ];
    // ProductionData.aggregate.mockResolvedValue(mockAggregatedData); // This is already set in beforeEach

    const res = await request(app).get('/monitoring/production/current');

    // Expected response body structure based on controller logic
    const expectedResponseBody = {
      success: true,
      data: {
        plants: mockAggregatedData.map(plant => ({ ...plant, _id: plant._id.toString() })), // Convert _id to string
        summary: {
          totalProduction: '250.00', // 100 + 150
          totalCapacity: '320.00',   // 120 + 200
          averageEfficiency: '79.16', // (83.33 + 75.00) / 2 = 79.165 -> 79.16
          plantCount: 2,
          unit: 'MW'
        }
      }
    };

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(expectedResponseBody);
    expect(ProductionData.aggregate).toHaveBeenCalledTimes(1);
  });

  // Test 2: POST /monitoring - Debería crear nuevos datos de producción y una alerta si la eficiencia es baja
  test('POST /monitoring should create new production data and a medium alert if efficiency is low', async () => {
    const newData = { plantId: 'plantC', efficiency: 60, value: 800 };
    const mockSavedData = { _id: new mongoose.Types.ObjectId(), ...newData };
    ProductionData.create.mockResolvedValue(mockSavedData);
    Alert.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId(), type: 'low-production', severity: 'medium' });

    const res = await request(app).post('/monitoring/production').send(newData);

    const expectedSavedData = { ...mockSavedData, _id: mockSavedData._id.toString() }; // Convert _id to string

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(expectedSavedData); // Compare with converted data
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

    const expectedUpdatedData = { ...mockUpdatedData, _id: mockUpdatedData._id.toString() }; // Convert _id to string

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(expectedUpdatedData); // Compare with converted data
    expect(ProductionData.findByIdAndUpdate).toHaveBeenCalledWith(dataId.toString(), updatedData, { new: true, runValidators: true });
  });

  // Test 4: GET /alerts - Debería devolver una lista de alertas
  test('GET /alerts should return a list of alerts', async () => {
    const mockAlerts = [
      { _id: new mongoose.Types.ObjectId(), type: 'low-production', severity: 'high', plantId: 'plantA' },
      { _id: new mongoose.Types.ObjectId(), type: 'maintenance', severity: 'low', plantId: 'plantB' },
    ];
    // Set the resolved value for the limit method of the chained mock
    Alert._mockLimit.mockResolvedValue(mockAlerts.map(alert => ({ ...alert, _id: alert._id.toString() }))); // Convert _id to string

    const res = await request(app).get('/monitoring/alerts');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockAlerts.map(alert => ({ ...alert, _id: alert._id.toString() }))); // Convert _id to string
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
