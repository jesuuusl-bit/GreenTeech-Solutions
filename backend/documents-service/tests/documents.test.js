const documentController = require('../src/controllers/documentController');
const Document = require('../src/models/Document');
const mongoose = require('mongoose'); // Re-add global import

// Mock del modelo Document
jest.mock('../src/models/Document', () => {
  const mongoose = require('mongoose');
  const MockDocument = jest.fn(); // This will be our mock constructor
  
  // Mock static methods
  MockDocument.find = jest.fn().mockReturnThis();
  MockDocument.populate = jest.fn().mockReturnThis();
  MockDocument.sort = jest.fn().mockResolvedValue([]);
  MockDocument.countDocuments = jest.fn().mockResolvedValue(0);

  // Default implementation for the constructor
  MockDocument.mockImplementation((data) => ({
    ...data,
    _id: new mongoose.Types.ObjectId(),
    save: jest.fn().mockResolvedValue(data), // Default save behavior
  }));

  return MockDocument;
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

  // Test para getAllDocuments
  test('getAllDocuments should return an array of documents', async () => {
    const mockDocuments = [{ title: 'Doc1', _id: new mongoose.Types.ObjectId() }, { title: 'Doc2', _id: new mongoose.Types.ObjectId() }];
    Document.find.mockReturnThis();
    Document.populate.mockReturnThis();
    Document.sort.mockResolvedValue(mockDocuments);

    await documentController.getAllDocuments(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({ title: 'Doc1' }),
        expect.objectContaining({ title: 'Doc2' }),
      ]),
    })); // toEqual con expect.arrayContaining y expect.objectContaining
    expect(res.json.mock.calls[0][0].data.length).toBe(2); // toBe
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
    req.body = { title: 'New Doc', type: 'report', fileName: 'new.pdf', fileUrl: '/new.pdf', uploadedBy: new mongoose.Types.ObjectId() };
    const mockSavedDoc = { _id: new mongoose.Types.ObjectId(), ...req.body };
    
    // Mock the constructor for this specific test
    Document.mockImplementationOnce((data) => ({
      ...data,
      _id: mockSavedDoc._id, // Ensure the mock ID is used
      save: jest.fn().mockResolvedValue(mockSavedDoc),
    }));

    await documentController.createDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ title: 'New Doc' }),
    }));
    expect(res.json.mock.calls[0][0].data.title).toBe('New Doc');
    expect(res.json.mock.calls[0][0].data).toHaveProperty('_id');
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

  // Test para uploadDocument con archivo
  test('uploadDocument should upload a file and create a document record', async () => {
    const mockFile = {
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('test content'),
    };
    req.file = mockFile;
    req.body = { title: 'Uploaded Doc', type: 'manual', projectId: new mongoose.Types.ObjectId() };
    req.user = { id: new mongoose.Types.ObjectId() }; // Mock user from auth middleware

    const mockSavedDoc = {
      _id: new mongoose.Types.ObjectId(),
      title: req.body.title,
      type: req.body.type,
      fileName: mockFile.originalname,
      fileUrl: `/uploads/${mockFile.originalname}`,
      fileSize: mockFile.size,
      mimetype: mockFile.mimetype,
      uploadedBy: req.user.id,
      projectId: req.body.projectId,
    };

    // Mock the constructor for this specific test
    Document.mockImplementationOnce((data) => ({
      ...data,
      _id: mockSavedDoc._id, // Ensure the mock ID is used
      save: jest.fn().mockResolvedValue(mockSavedDoc),
    }));

    await documentController.uploadDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        title: 'Uploaded Doc',
        fileName: 'test.pdf',
      }),
    }));
    expect(res.json.mock.calls[0][0].data.fileUrl).toContain('/uploads/test.pdf'); // toContain
    expect(res.json.mock.calls[0][0].data).toHaveProperty('uploadedBy', req.user.id); // toHaveProperty
  });
});
