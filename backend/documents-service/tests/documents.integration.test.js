process.env.MONGO_URI = 'mongodb://localhost:27017/test_documents_db'; // Set MONGO_URI for tests

const request = require('supertest');
// const { app, initializeGridFS, configureApp } = require('../../documents-service/src/server'); // REMOVE THIS LINE
const mongoose = require('mongoose');
const Document = require('../../documents-service/src/models/Document'); // Importa el modelo real para mockearlo
const path = require('path');
const fs = require('fs');
const mockStream = jest.requireActual('stream'); // Import stream module for mocking

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
  MockDocument.findByIdAndUpdate = jest.fn().mockResolvedValue(null); // Corrected
  MockDocument.findByIdAndDelete = jest.fn().mockResolvedValue(null); // Corrected
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
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose, // Importa y conserva todas las funciones reales de mongoose
    connect: jest.fn((uri) => Promise.resolve({ // Mockea connect para que siempre resuelva a un objeto con 'db', ignorando la uri
      connection: {
        db: {
          collection: jest.fn((name) => {
            // Mock for GridFS collections
            if (name === 'fs.files' || name === 'fs.chunks') {
              return {
                insertOne: jest.fn().mockResolvedValue({ insertedId: new actualMongoose.Types.ObjectId() }),
                find: jest.fn(() => ({
                  toArray: jest.fn().mockResolvedValue([]), // Mock for find().toArray()
                })),
              };
            }
            // Default mock for other collections
            return {
              insertOne: jest.fn().mockResolvedValue({ insertedId: new actualMongoose.Types.ObjectId() }),
              find: jest.fn(() => ({
                toArray: jest.fn().mockResolvedValue([]),
              })),
            };
          }),
        },
      },
    })),
    connection: {
      readyState: 1, // Simula que la conexión está lista
      on: jest.fn(),
      once: jest.fn(),
      db: { // Add a mock db object here for GridFS initialization
        collection: jest.fn((name) => {
          // Mock for GridFS collections
          if (name === 'fs.files' || name === 'fs.chunks') {
            return {
              insertOne: jest.fn().mockResolvedValue({ insertedId: new actualMongoose.Types.ObjectId() }),
              find: jest.fn(() => ({
                toArray: jest.fn().mockResolvedValue([]),
              })),
            };
          }
          // Default mock for other collections
          return {
            insertOne: jest.fn().mockResolvedValue({ insertedId: new actualMongoose.Types.ObjectId() }),
            find: jest.fn(() => ({
              toArray: jest.fn().mockResolvedValue([]),
            })),
          };
        }),
      },
    },
    Schema: actualMongoose.Schema,
    model: actualMongoose.model,
    Types: {
      ObjectId: actualMongoose.Types.ObjectId,
    },
    mongo: { // Mock mongoose.mongo for GridFSBucket
      GridFSBucket: jest.fn().mockImplementation(() => ({
        openUploadStream: (filename, options) => { // This is now a plain function
          const mockId = new actualMongoose.Types.ObjectId();
          const mockUploadStream = {
            id: mockId,
            end: jest.fn((chunk, encoding, callback) => {
              mockUploadStream.emit('finish', { _id: mockId, filename, ...options.metadata });
              if (callback) callback();
            }),
            on: jest.fn(function(event, handler) {
              if (event === 'finish') {
                this._finishHandler = handler;
              } else if (event === 'error') {
                this._errorHandler = handler;
              }
            }),
            emit: jest.fn(function(event, data) {
              if (event === 'finish' && this._finishHandler) {
                this._finishHandler(data);
              } else if (event === 'error' && this._errorHandler) {
                this._errorHandler(data);
              }
            }),
          };
          return mockUploadStream;
        },
        openDownloadStream: jest.fn(() => {
          const downloadStream = new mockStream.PassThrough();
          process.nextTick(() => {
            downloadStream.emit('data', 'mock file content');
            downloadStream.end();
          });
          return downloadStream;
        }),
        find: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([{ filename: 'mock_file.pdf', contentType: 'application/pdf' }]),
        })),
      })),
    },
  };
});

describe('Documents Service - Integration Tests', () => {
  let server;
  let agent; // supertest agent
  let app; // Declare app here
  let initializeGridFS;
  let configureApp;

  beforeAll(async () => {
    // Import server.js here, AFTER all mocks are defined
    const serverModule = require('../../documents-service/src/server');
    app = serverModule; // app is the default export
    initializeGridFS = serverModule.initializeGridFS;
    configureApp = serverModule.configureApp;

    console.log('App object after module import in beforeAll:', app); // Debug app object

    await initializeGridFS(); // Ensure GridFS is initialized
    configureApp(); // Configure the app with routes
    agent = request(app); // Initialize supertest agent with the app here

    // Asegúrate de que el servidor se inicie antes de los tests
    server = app.listen(0, () => { // Use port 0 for dynamic port assignment
      const port = server.address().port;
      console.log(`Documents Service running on dynamic port ${port} for integration tests`);
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
    Document.find.mockReturnThis();
    Document.populate.mockReturnThis();
    Document.sort.mockResolvedValue([]);
    Document.countDocuments.mockResolvedValue(0);
    Document.findById.mockResolvedValue(null);
    Document.findByIdAndUpdate.mockResolvedValue(null); // Corrected
    Document.findByIdAndDelete.mockResolvedValue(null); // Corrected
    Document.create.mockResolvedValue(null);

    // Default implementation for the constructor (if new Document() is ever called)
    Document.mockImplementation((data) => ({
      ...data,
      _id: new mongoose.Types.ObjectId(),
      save: jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(), ...data }),
    }));
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

    const res = await agent.get('/documents'); // Use agent

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
    const mockGridfsId = new mongoose.Types.ObjectId(); // New mock for gridfsId
    const mockSavedDoc = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Test Document',
      type: 'report',
      fileName: 'test_upload.pdf', // Use PDF extension
      gridfsId: mockGridfsId, // Store gridfsId
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

    const res = await agent.post('/documents/upload') // Use agent
      .set('x-user-id', mockUserId.toString()) // Simular usuario autenticado
      .set('x-user-role', 'admin')
      .field('title', 'Test Document')
      .field('type', 'report')
      .field('projectId', mockProjectId.toString())
      .attach('document', filePath);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('title', 'Test Document');
    expect(res.body.data).toHaveProperty('fileName', 'test_upload.pdf');
    expect(res.body.data).toHaveProperty('gridfsId'); // Check for gridfsId
    expect(Document).toHaveBeenCalledTimes(1); // Assert that the constructor was called
    expect(Document.mock.results[0].value.save).toHaveBeenCalledTimes(1);

    fs.unlinkSync(filePath); // Limpiar archivo de prueba
  });

  // Test 3: GET /documents/health - Debería devolver el estado de salud
  test('GET /documents/health should return health status', async () => {
    const res = await agent.get('/health'); // Use agent

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('documents-service');
    expect(res.body.status).toBe('healthy');
  });
});
