// Define un JWT_SECRET para el entorno de pruebas
process.env.JWT_SECRET = 'test_jwt_secret'; 
process.env.USERS_SERVICE_URL = 'http://localhost:5001'; // Mock user service URL
process.env.DOCUMENTS_SERVICE_URL = 'http://localhost:5005'; // Mock documents service URL

const request = require('supertest');
const app = require('../src/app'); // Importa tu app Express desde el nuevo app.js
const services = require('../src/config/services'); // Para acceder a las URLs de los servicios
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const axios = require('axios'); // Import axios to mock it
const stream = require('stream'); // Import stream module

// Mock de los servicios downstream
jest.mock('axios');

// Mock del servicio de documentos (para simular la subida de archivos)
const express = require('express');
const multer = require('multer');
const cors = require('cors');

const mockDocumentsApp = express();
const upload = multer({ storage: multer.memoryStorage() });
mockDocumentsApp.use(cors());
mockDocumentsApp.use(express.json());

mockDocumentsApp.post('/upload', upload.any(), (req, res) => { // Changed to upload.any()
  console.log('Mock Documents App: Received POST /upload');
  console.log('Mock Documents App: req.headers:', req.headers);
  console.log('Mock Documents App: req.body:', req.body);
  console.log('Mock Documents App: req.files:', req.files);
  if (!req.files || req.files.length === 0) { // Adjusted check for req.files and using req.files[0]
    console.log('Mock Documents App: No file received, sending 400 Bad Request');
    return res.status(400).json({ success: false, message: 'No se ha proporcionado ningún archivo.' });
  }
  const file = req.files[0]; // Assuming single file upload for this test
  console.log('Mock Documents App: File received, sending 201 Created');
  res.status(201).json({
    success: true,
    message: 'Mock document uploaded successfully!',
    data: {
      _id: 'mockDocId',
      title: req.body.title || file.originalname,
      type: req.body.type || 'other',
      fileName: file.originalname,
      fileUrl: `/uploads/${file.originalname}`,
      fileSize: file.size,
      mimetype: file.mimetype,
      uploadedBy: req.headers['x-user-id'] || 'mockUserId',
      projectId: req.body.projectId || null,
    },
  });
});

mockDocumentsApp.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'documents-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mock del servicio de usuarios
const mockUsersApp = express();
mockUsersApp.use(cors());
mockUsersApp.use(express.json());

mockUsersApp.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'users-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Define un JWT_SECRET para el entorno de pruebas
process.env.JWT_SECRET = 'test_jwt_secret'; 
process.env.USERS_SERVICE_URL = 'http://localhost:5001'; // Mock user service URL
process.env.DOCUMENTS_SERVICE_URL = 'http://localhost:5005'; // Mock documents service URL

describe('API Gateway - Integration Tests', () => {
  let testUserToken;
  const testUserId = '60d5ec49f8c7a10015a4b7c8'; // Un ID de usuario de prueba
  const testUserRole = 'admin'; // Un rol de usuario de prueba
  let mockDocumentsServer; // Para la instancia del servidor mock
  let mockUsersServer; // Para la instancia del servidor mock de usuarios

  beforeAll((done) => {
    // Generar un token JWT válido para el usuario de prueba
    testUserToken = jwt.sign({ id: testUserId, role: testUserRole }, process.env.JWT_SECRET, { expiresIn: '1h' });

    let documentsServerStarted = false;
    let usersServerStarted = false;

    const checkDone = () => {
      if (documentsServerStarted && usersServerStarted) {
        done();
      }
    };

    // Iniciar el mock documents-service en un puerto dinámico
    mockDocumentsServer = mockDocumentsApp.listen(0, () => { // Usar puerto 0 para que el SO asigne uno
      const port = mockDocumentsServer.address().port;
      process.env.DOCUMENTS_SERVICE_URL = `http://localhost:${port}`;
      console.log(`Mock Documents Service running on port ${port}`);
      documentsServerStarted = true;
      checkDone();
    });

    // Iniciar el mock users-service en un puerto dinámico
    mockUsersServer = mockUsersApp.listen(0, () => { // Usar puerto 0 para que el SO asigne uno
      const port = mockUsersServer.address().port;
      process.env.USERS_SERVICE_URL = `http://localhost:${port}`;
      console.log(`Mock Users Service running on port ${port}`);
      usersServerStarted = true;
      checkDone();
    });
  }, 10000); // Establecer el timeout del hook beforeAll a 10 segundos

  afterAll((done) => {
    let documentsServerClosed = false;
    let usersServerClosed = false;

    const checkDone = () => {
      if (documentsServerClosed && usersServerClosed) {
        done();
      }
    };

    // Cerrar el mock documents-service
    mockDocumentsServer.close(() => {
      documentsServerClosed = true;
      checkDone();
    });

    // Cerrar el mock users-service
    mockUsersServer.close(() => {
      usersServerClosed = true;
      checkDone();
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    axios.mockImplementation((config) => {
      const { method, url, data } = config;

      if (method === 'GET') {
        if (url === `${services.USERS_SERVICE}/health`) {
          return Promise.resolve({ status: 200, data: { status: 'healthy', service: 'users-service' }, headers: {} });
        }
        if (url.includes('/users')) {
          return Promise.resolve({ status: 200, data: { success: true, data: [{ name: 'Test User' }] }, headers: {} });
        }
        if (url.includes('/projects')) {
          return Promise.resolve({ status: 200, data: { success: true, data: [{ name: 'Project Alpha' }] }, headers: {} });
        }
        if (url.includes('/monitoring')) {
          return Promise.resolve({ status: 200, data: { success: true, data: [{ plantId: 'plant1' }] }, headers: {} });
        }
        if (url === `${services.DOCUMENTS_SERVICE}/documents/mockDocId/download`) { // Corrected URL check
          const mockFileContent = 'This is a mock file content for download.';
          const readableStream = new stream.Readable();
          readableStream.push(mockFileContent);
          readableStream.push(null); // No more data

          return Promise.resolve({
            status: 200,
            data: readableStream, // Return a stream
            headers: {
              'content-type': 'text/plain',
              'content-disposition': `attachment; filename="mock_file.txt"`,
            },
          });
        }
      } else if (method === 'POST') {
        if (url.includes('/login')) {
          return Promise.resolve({ status: 200, data: { success: true, token: 'mockToken' }, headers: {} });
        }
        if (url.includes('/upload')) { // Handle documents upload
          // Simulate the mockDocumentsApp's behavior
          // Check if the data is present (indicating a file upload)
          if (data) { // Simplified check for data presence
            return Promise.resolve({ status: 201, data: { success: true, message: 'Mock document uploaded successfully!', data: { _id: 'mockDocId', title: 'Test Document' } }, headers: {} });
          } else {
            return Promise.resolve({ status: 400, data: { success: false, message: 'No file provided by mock service.' }, headers: {} });
          }
        }
      }
      // Default fallback for any unhandled axios call
      return Promise.resolve({ status: 200, data: { success: true, message: 'Default mocked response' }, headers: {} });
    });
  });

  // Test de integración 1: Health check del users-service (debería ser proxyado)
  test('GET /api/users/health should proxy to users-service health endpoint', async () => {
    axios.get.mockResolvedValue({ status: 200, data: { status: 'healthy', service: 'users-service' }, headers: {} });

    const response = await request(app)
      .get('/api/users/health')
      .expect(200);

    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET', // Changed to uppercase
        url: `${services.USERS_SERVICE}/health`, // Corrected URL
        headers: expect.objectContaining({
          'x-forwarded-host': expect.any(String),
        }),
      })
    );
    expect(response.body).toEqual({ status: 'healthy', service: 'users-service' });
  });

  // Test de integración 2: Ruta de login (debería ser proxyada)
  test('POST /api/users/login should proxy to users-service login endpoint', async () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    axios.post.mockResolvedValue({ status: 200, data: { success: true, token: 'mockToken' }, headers: {} });

    const response = await request(app)
      .post('/api/users/login')
      .send(credentials)
      .expect(200);
    
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST', // Changed to uppercase
        url: `${services.USERS_SERVICE}/users/login`, // Corrected URL
        data: credentials, // The data should be part of the config object
        headers: expect.objectContaining({
          'x-forwarded-host': expect.any(String),
        }),
      })
    );
    expect(response.body).toEqual({ success: true, token: 'mockToken' });
  });

  // Test de integración 3: Subida de documentos (requiere multer y form-data)
  test('POST /api/documents/upload should proxy file upload to documents-service', async () => {
    const filePath = `${__dirname}/test_file.txt`; // Crea un archivo de prueba temporal
    const fs = require('fs');
    fs.writeFileSync(filePath, 'This is a test file content.');

    const response = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${testUserToken}`) // Add Authorization header
      .attach('document', filePath) // 'document' es el nombre del campo del archivo
      .field('title', 'Test Document')
      .field('type', 'other')
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('title', 'Test Document');

    fs.unlinkSync(filePath); // Limpia el archivo de prueba
  });

  // Test de integración 4: Acceso a ruta protegida de users-service
  test('GET /api/users should proxy to users-service and require authentication', async () => {
    axios.get.mockResolvedValue({ status: 200, data: { success: true, data: [{ name: 'Test User' }] }, headers: {} });

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(200);

    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET', // Changed to uppercase
        url: `${services.USERS_SERVICE}/users`,
        headers: expect.objectContaining({
          'x-user-id': testUserId,
          'x-user-role': testUserRole,
        }),
      })
    );
    expect(response.body.data[0]).toHaveProperty('name', 'Test User');
  });

  // Test de integración 5: Acceso a ruta protegida de projects-service
  test('GET /api/projects should proxy to projects-service and require authentication', async () => {
    axios.get.mockResolvedValue({ status: 200, data: { success: true, data: [{ name: 'Project Alpha' }] }, headers: {} });

    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(200);

    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET', // Changed to uppercase
        url: `${services.PROJECTS_SERVICE}/projects`,
        headers: expect.objectContaining({
          'x-user-id': testUserId,
          'x-user-role': testUserRole,
        }),
      })
    );
    expect(response.body.data[0]).toHaveProperty('name', 'Project Alpha');
  });

  // Test de integración 6: Acceso a ruta protegida de monitoring-service
  test('GET /api/monitoring should proxy to monitoring-service and require authentication', async () => {
    axios.get.mockResolvedValue({ status: 200, data: { success: true, data: [{ plantId: 'plant1' }] }, headers: {} });

    const response = await request(app)
      .get('/api/monitoring')
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(200);

    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET', // Changed to uppercase
        url: `${services.MONITORING_SERVICE}/monitoring`,
        headers: expect.objectContaining({
          'x-user-id': testUserId,
          'x-user-role': testUserRole,
        }),
      })
    );
    expect(response.body.data[0]).toHaveProperty('plantId', 'plant1');
  });

  // Test de integración 7: Descarga de documentos
  test('GET /api/documents/:id/download should proxy to documents-service download endpoint', async () => {
    const documentId = 'mockDocId'; // Use a mock document ID
    const mockFileContent = 'This is a mock file content for download.';

    const response = await request(app)
      .get(`/api/documents/${documentId}/download`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(200);

    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: `${services.DOCUMENTS_SERVICE}/documents/${documentId}/download`,
        headers: expect.objectContaining({
          'x-user-id': testUserId,
          'x-user-role': testUserRole,
        }),
      })
    );
    expect(response.text).toEqual(mockFileContent);
  });
});
