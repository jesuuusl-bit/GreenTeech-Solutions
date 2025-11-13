const request = require('supertest');
const app = require('../../documents-service/src/server'); // Importa tu app Express
const mongoose = require('mongoose');
const Document = require('../../documents-service/src/models/Document'); // Importa el modelo real para mockearlo
const path = require('path');
const fs = require('fs');

// Mock del modelo Document
jest.mock('../../documents-service/src/models/Document', () => ({
  find: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue([]),
  countDocuments: jest.fn().mockResolvedValue(0),
  findById: jest.fn().mockResolvedValue(null),
  findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  findByIdAndDelete: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue(null),
  // Mock del constructor para new Document()
  mockImplementation: jest.fn((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ _id: new jest.requireActual('mongoose').Types.ObjectId(), ...data }),
  })),
}));

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
    Document.find.mockReturnThis();
    Document.populate.mockReturnThis();
    Document.sort.mockResolvedValue([]);
    Document.countDocuments.mockResolvedValue(0);
    Document.findById.mockResolvedValue(null);
    Document.findByIdAndUpdate.mockResolvedValue(null);
    Document.findByIdAndDelete.mockResolvedValue(null);
    Document.create.mockResolvedValue(null);
    Document.mockImplementation.mockClear();
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

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockDocuments);
    expect(Document.find).toHaveBeenCalledTimes(1);
    expect(Document.populate).toHaveBeenCalledWith('uploadedBy', 'name email');
    expect(Document.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  // Test 2: POST /documents/upload - Debería subir un documento y guardar sus metadatos
  test('POST /documents/upload should upload a document and save its metadata', async () => {
    const filePath = path.join(__dirname, 'test_upload.txt');
    fs.writeFileSync(filePath, 'This is a test file for upload.');

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
