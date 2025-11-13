const documentController = require('../src/controllers/documentController');
const Document = require('../src/models/Document');
const mongoose = require('mongoose'); // Re-add global import

// Mock del modelo Document
jest.mock('../src/models/Document', () => {
  const mongoose = require('mongoose'); // Import mongoose inside the mock factory
  return {
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue([]),
    countDocuments: jest.fn().mockResolvedValue(0),
    // Mock del constructor para new Document()
    mockImplementation: jest.fn((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(), ...data }),
    })),
  };
});

describe('Documents Service - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // Limpiar mocks antes de cada test
    Document.find.mockClear();
    Document.populate.mockClear();
    Document.sort.mockClear();
    Document.countDocuments.mockClear();
    Document.mockImplementation.mockClear();
  });

  // Test para testMongoDB
  test('testMongoDB should return document count', async () => {
    Document.countDocuments.mockResolvedValue(5);

    await documentController.testMongoDB(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      documentsCount: 5,
    })); // toHaveProperty
  });

  // Test para uploadDocument (requiere req.file)
  test('uploadDocument should return 400 if no file is provided', async () => {
    req.file = undefined; // No file
    await documentController.uploadDocument(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('No se ha proporcionado ningún archivo.'),
    })); // toContain
  });
});