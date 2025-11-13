const request = require('supertest');
const app = require('../../documents-service/src/server'); // Importa tu app Express
const mongoose = require('mongoose');
const Document = require('../../documents-service/src/models/Document'); // Importa el modelo real para mockearlo
const path = require('path');
const fs = require('fs');

// Mock del modelo Document
jest.mock('../../documents-service/src/models/Document', () => {
  const mongoose = jest.requireActual('mongoose'); // Get actual mongoose for ObjectId
  const MockDocument = jest.fn(); // This will be our mock constructor

  // Mock static methods
  MockDocument.find = jest.fn().mockReturnThis();
  MockDocument.populate = jest.fn().mockReturnThis();
  MockDocument.sort = jest.fn().mockResolvedValue([]);
  MockDocument.countDocuments = jest.fn().mockResolvedValue(0);
  MockDocument.findById = jest.fn().mockResolvedValue(null);
  MockDocument.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
  MockDocument.findByIdAndDelete = jest.fn().mockResolvedValue(null);
  MockDocument.create = jest.fn().mockResolvedValue(null);

  // Default implementation for the constructor (if new Document() is ever called)
  MockDocument.mockImplementation((data) => ({
    ...data,
    _id: new mongoose.Types.ObjectId(),
    save: jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(), ...data }),
  }));

  return MockDocument;
});

// Mock de mongoose.connect para evitar la conexión real a la DB
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'), // Importa y conserva todas las funciones reales de mongoose
  connect: jest.fn(() => Promise.resolve()), // Mockea connect para que siempre resuelva
  connection: {
    readyState: 1, // Simula que la conexión está lista
    on: jest.fn(),
    once: jest.fn(),
  },
  Schema: jest.requireActual('mongoose').Schema,
  model: jest.requireActual('mongoose').model,
  Types: {
    ObjectId: jest.requireActual('mongoose').Types.ObjectId,
  },
}));

describe('Documents Service - Integration Tests', () => {
  let server;

  beforeAll((done) => {
    // Asegúrate de que el servidor se inicie antes de los tests
    server = app.listen(5005, () => {
      console.log('Documents Service running on port 5005 for integration tests');
      done();
    });
  });

  afterAll((done) => {
    // Cierra el servidor después de todos los tests
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear mocks del modelo Document
    // Clear the mock constructor itself
    Document.mockClear();
    // Clear mocks on static methods
    Document.find.mockClear().mockReturnThis();
    Document.populate.mockClear().mockReturnThis();
    Document.sort.mockClear().mockResolvedValue([]);
    Document.countDocuments.mockClear().mockResolvedValue(0);
    Document.findById.mockClear().mockResolvedValue(null);
    Document.findByIdAndUpdate.mockClear().mockResolvedValue(null);
    Document.findByIdAndDelete.mockClear().mockResolvedValue(null);
    Document.create.mockClear().mockResolvedValue(null);
  });

  // Test 1: GET /documents - Debería devolver una lista de documentos
  test('GET /documents should return a list of documents', async () => {
    const mockDocuments = [
      { _id: new mongoose.Types.ObjectId(), title: 'Doc1', fileName: 'file1.pdf', uploadedBy: { _id: new mongoose.Types.ObjectId(), name: 'User1' } },
      { _id: new mongoose.Types.ObjectId(), title: 'Doc2', fileName: 'file2.pdf', uploadedBy: { _id: new mongoose.Types.ObjectId(), name: 'User2' } },
    ];
    Document.find.mockReturnThis();
    Document.populate.mockReturnThis();
    Document.sort.mockResolvedValue(mockDocuments);

    const res = await request(app).get('/documents');

    // Convert ObjectIds in mockDocuments to strings for comparison
    const expectedDocuments = mockDocuments.map(doc => ({
      ...doc,
      _id: doc._id.toString(),
      uploadedBy: {
        ...doc.uploadedBy,
        _id: doc.uploadedBy._id.toString(),
      },
    }));

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(expectedDocuments); // Compare with converted documents
    expect(Document.find).toHaveBeenCalledTimes(1);
    expect(Document.populate).toHaveBeenCalledWith('uploadedBy', 'name email');
    expect(Document.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  // Test 2: POST /documents/upload - Debería subir un documento y guardar sus metadatos
  test('POST /documents/upload should upload a document and save its metadata', async () => {
    const filePath = path.join(__dirname, 'test_upload.pdf'); // Change to PDF extension
    // Create a dummy PDF file content (minimal valid PDF structure)
    const pdfContent = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000074 00000 n\ntrailer<</Size 3/Root 1 0 R>>startxref\n123\n%%EOF';
    fs.writeFileSync(filePath, pdfContent);

    const mockUserId = new mongoose.Types.ObjectId();
    const mockProjectId = new mongoose.Types.ObjectId();
    const mockSavedDoc = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Test Document',
      type: 'report',
      fileName: 'test_upload.txt',
      fileUrl: `/uploads/test_upload.txt`,
      fileSize: 29, // "This is a test file for upload.".length
      mimetype: 'text/plain',
      uploadedBy: mockUserId,
      projectId: mockProjectId,
      createdAt: new Date(),
    };

    // Mockear el constructor de Document para este test
    Document.mockImplementationOnce((data) => ({
      ...data,
      _id: mockSavedDoc._id,
      save: jest.fn().mockResolvedValue(mockSavedDoc),
    }));

    const res = await request(app)
      .post('/documents/upload')
      .set('x-user-id', mockUserId.toString()) // Simular usuario autenticado
      .set('x-user-role', 'admin')
      .field('title', 'Test Document')
      .field('type', 'report')
      .field('projectId', mockProjectId.toString())
      .attach('document', filePath);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('title', 'Test Document');
    expect(res.body.data).toHaveProperty('fileName', 'test_upload.txt');
    expect(Document.mockImplementation).toHaveBeenCalledTimes(1);
    expect(Document.mock.results[0].value.save).toHaveBeenCalledTimes(1);

    fs.unlinkSync(filePath); // Limpiar archivo de prueba
  });

  // Test 3: GET /documents/health - Debería devolver el estado de salud
  test('GET /documents/health should return health status', async () => {
    const res = await request(app).get('/health'); // Asumiendo que el health check está en /health

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('documents-service');
    expect(res.body.status).toBe('healthy');
  });
});
