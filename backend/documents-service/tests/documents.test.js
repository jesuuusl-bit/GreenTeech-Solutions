const documentController = require('../src/controllers/documentController');
const Document = require('../src/models/Document'); // Mock this
const mongoose = require('mongoose');

// Mock del modelo Document
jest.mock('../src/models/Document', () => ({
  find: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue([]),
  countDocuments: jest.fn().mockResolvedValue(0),
  save: jest.fn().mockResolvedValue({ _id: 'mockId', title: 'Test Doc' }),
  // Mock del constructor para new Document()
  // Esto es un mock básico, necesitarías ajustarlo según cómo uses el constructor
  // Por ejemplo, si el constructor valida, este mock podría necesitar simular esa validación
  mockImplementation: jest.fn((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ _id: 'mockId', ...data }),
  })),
}));

describe('Documents Service - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  // Test para getAllDocuments
  test('getAllDocuments should return an array of documents', async () => {
    const mockDocuments = [{ title: 'Doc1' }, { title: 'Doc2' }];
    Document.find.mockReturnThis();
    Document.populate.mockReturnThis();
    Document.sort.mockResolvedValue(mockDocuments);

    await documentController.getAllDocuments(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockDocuments });
    expect(res.json.mock.calls[0][0].data).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Doc1' }),
      expect.objectContaining({ title: 'Doc2' }),
    ])); // toEqual con expect.arrayContaining y expect.objectContaining
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

  // Test para createDocument (sin archivo)
  test('createDocument should create a document', async () => {
    req.body = { title: 'New Doc', type: 'report', fileName: 'new.pdf', fileUrl: '/new.pdf', uploadedBy: 'userId' };
    const mockSavedDoc = { _id: 'newDocId', ...req.body };
    Document.mockImplementationOnce(() => ({
      ...req.body,
      save: jest.fn().mockResolvedValue(mockSavedDoc),
    }));

    await documentController.createDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ title: 'New Doc' }),
    }));
    expect(res.json.mock.calls[0][0].data.title).toBe('New Doc'); // toBe
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

  // Puedes añadir más tests unitarios aquí para la lógica de validación, etc.
});