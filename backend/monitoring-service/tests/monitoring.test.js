const monitoringController = require('../src/controllers/monitoringController');
const ProductionData = require('../src/models/ProductionData');
const Alert = require('../src/models/Alert');
// const mongoose = require('mongoose'); // Remove global import

// Mock de los modelos
jest.mock('../src/models/ProductionData', () => {
  const mongoose = require('mongoose'); // Import mongoose inside the mock factory
  return {
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue([]),
    findByIdAndUpdate: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(null),
  };
});
jest.mock('../src/models/Alert', () => {
  const mongoose = require('mongoose'); // Import mongoose inside the mock factory
  return {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue(null),
  };
});

describe('Monitoring Service - Unit Tests', () => {
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

  // Test para getProductionData
  test('getProductionData should return all production data', async () => {
    const mockData = [{ plantId: 'p1', value: 100, _id: new mongoose.Types.ObjectId() }];
    ProductionData.find.mockReturnThis();
    ProductionData.populate.mockReturnThis();
    ProductionData.sort.mockResolvedValue(mockData);

    await monitoringController.getProductionData(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({ plantId: 'p1' }),
      ]),
    })); // toEqual con arrayContaining
    expect(res.json.mock.calls[0][0].data.length).toBe(1); // toBe
  });

  // Test para createProductionData y alerta de eficiencia baja
  test('createProductionData should create new production data and a medium alert if efficiency is low', async () => {
    req.body = { plantId: 'plantA', efficiency: 60, value: 100 };
    const mockSavedData = { _id: new mongoose.Types.ObjectId(), ...req.body };
    ProductionData.create.mockResolvedValue(mockSavedData);
    Alert.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId(), type: 'low-production', severity: 'medium' });

    await monitoringController.createProductionData(req, res);

    expect(ProductionData.create).toHaveBeenCalledWith(req.body);
    expect(Alert.create).toHaveBeenCalledWith(expect.objectContaining({
      type: 'low-production',
      severity: 'medium',
      plantId: 'plantA',
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockSavedData,
    }));
    expect(res.json.mock.calls[0][0].data).toHaveProperty('efficiency', 60); // toHaveProperty
  });

  // Test para updateProductionData
  test('updateProductionData should update existing production data', async () => {
    req.params = { id: new mongoose.Types.ObjectId().toString() };
    req.body = { efficiency: 85 };
    const mockUpdatedData = { _id: req.params.id, plantId: 'plantA', efficiency: 85 };
    ProductionData.findByIdAndUpdate.mockResolvedValue(mockUpdatedData);

    await monitoringController.updateProductionData(req, res);

    expect(ProductionData.findByIdAndUpdate).toHaveBeenCalledWith(req.params.id, req.body, { new: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockUpdatedData,
    }));
    expect(res.json.mock.calls[0][0].data.efficiency).toBe(85); // toBe
  });

  // Test para getAlerts
  test('getAlerts should return all alerts', async () => {
    const mockAlerts = [{ type: 'low-production', severity: 'high', _id: new mongoose.Types.ObjectId() }];
    Alert.find.mockReturnThis();
    Alert.sort.mockResolvedValue(mockAlerts);

    await monitoringController.getAlerts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({ type: 'low-production' }),
      ]),
    }));
    expect(res.json.mock.calls[0][0].data[0].type).toContain('production'); // toContain
    expect(res.json.mock.calls[0][0].data[0]).toHaveProperty('severity', 'high'); // toHaveProperty
  });

  // Puedes añadir más tests unitarios aquí para la lógica de alertas, etc.
});
