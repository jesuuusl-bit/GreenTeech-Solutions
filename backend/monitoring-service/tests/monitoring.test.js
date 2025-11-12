const monitoringController = require('../src/controllers/monitoringController');
const ProductionData = require('../src/models/ProductionData');
const Alert = require('../src/models/Alert');

// Mock de los modelos
jest.mock('../src/models/ProductionData');
jest.mock('../src/models/Alert');

describe('Monitoring Service - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  // Test para getProductionData
  test('getProductionData should return all production data', async () => {
    const mockData = [{ plantId: 'p1', value: 100 }];
    ProductionData.find.mockResolvedValue(mockData);

    await monitoringController.getProductionData(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockData,
    }));
    expect(res.json.mock.calls[0][0].data).toEqual(expect.arrayContaining([
      expect.objectContaining({ plantId: 'p1' }),
    ])); // toEqual con arrayContaining
  });

  // Test para createProductionData
  test('createProductionData should create new production data and an alert if efficiency is low', async () => {
    req.body = { plantId: 'plantA', efficiency: 60, value: 100 };
    const mockSavedData = { _id: 'dataId', ...req.body };
    ProductionData.create.mockResolvedValue(mockSavedData);
    Alert.create.mockResolvedValue({ _id: 'alertId', type: 'low-production' });

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
    req.params = { id: 'existingDataId' };
    req.body = { efficiency: 85 };
    const mockUpdatedData = { _id: 'existingDataId', plantId: 'plantA', efficiency: 85 };
    ProductionData.findByIdAndUpdate.mockResolvedValue(mockUpdatedData);

    await monitoringController.updateProductionData(req, res);

    expect(ProductionData.findByIdAndUpdate).toHaveBeenCalledWith('existingDataId', req.body, { new: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockUpdatedData,
    }));
    expect(res.json.mock.calls[0][0].data.efficiency).toBe(85); // toBe
  });

  // Test para getAlerts
  test('getAlerts should return all alerts', async () => {
    const mockAlerts = [{ type: 'low-production', severity: 'high' }];
    Alert.find.mockResolvedValue(mockAlerts);

    await monitoringController.getAlerts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockAlerts,
    }));
    expect(res.json.mock.calls[0][0].data[0].type).toContain('production'); // toContain
  });

  // Puedes añadir más tests unitarios aquí para la lógica de alertas, etc.
});