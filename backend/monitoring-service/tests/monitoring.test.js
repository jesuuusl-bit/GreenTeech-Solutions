const monitoringController = require('../src/controllers/monitoringController');
const ProductionData = require('../src/models/ProductionData');
const Alert = require('../src/models/Alert');
const mongoose = require('mongoose'); // Re-add global import

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
});