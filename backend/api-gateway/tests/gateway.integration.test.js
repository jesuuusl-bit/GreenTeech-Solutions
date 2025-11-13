const request = require('supertest');
const app = require('../src/app'); // Importa tu app Express desde el nuevo app.js
const services = require('../src/config/services'); // Para acceder a las URLs de los servicios
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const axios = require('axios'); // Import axios to mock it

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

mockDocumentsApp.post('/upload', upload.single('document'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided by mock service.' });
  }
  res.status(201).json({
    success: true,
    message: 'Mock document uploaded successfully!',
    data: {
      _id: 'mockDocId',
      title: req.body.title || req.file.originalname,
      type: req.body.type || 'other',
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.originalname}`,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
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

// Define un JWT_SECRET para el entorno de pruebas
process.env.JWT_SECRET = 'test_jwt_secret'; 
process.env.USERS_SERVICE_URL = 'http://localhost:5001'; // Mock user service URL
process.env.DOCUMENTS_SERVICE_URL = 'http://localhost:5005'; // Mock documents service URL

describe('API Gateway - Integration Tests', () => {
  let testUserToken;
  const testUserId = '60d5ec49f8c7a10015a4b7c8'; // Un ID de usuario de prueba
  const testUserRole = 'admin'; // Un rol de usuario de prueba
  let mockDocumentsServer; // Para la instancia del servidor mock

  beforeAll((done) => {
    // Generar un token JWT válido para el usuario de prueba
    testUserToken = jwt.sign({ id: testUserId, role: testUserRole }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Iniciar el mock documents-service
    mockDocumentsServer = mockDocumentsApp.listen(5005, () => {
      console.log('Mock Documents Service running on port 5005');
      done();
    });
  });

  afterAll((done) => {
    // Cerrar el mock documents-service
    mockDocumentsServer.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test de integración 1: Health check del users-service (debería ser proxyado)
  test('GET /api/users/health should proxy to users-service health endpoint', async () => {
    axios.get.mockResolvedValue({ status: 200, data: { status: 'healthy', service: 'users-service' } });

    const response = await request(app)
      .get('/api/users/health')
      .expect(200);

    expect(axios.get).toHaveBeenCalledWith(
      `${services.USERS_SERVICE}/health`,
      expect.objectContaining({
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
    axios.post.mockResolvedValue({ status: 200, data: { success: true, token: 'mockToken' } });

    const response = await request(app)
      .post('/api/users/login')
      .send(credentials)
      .expect(200);
    
    expect(axios.post).toHaveBeenCalledWith(
      `${services.USERS_SERVICE}/login`,
      credentials,
      expect.objectContaining({
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
    axios.get.mockResolvedValue({ status: 200, data: { success: true, data: [{ name: 'Test User' }] } });

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(200);

    expect(axios.get).toHaveBeenCalledWith(
      `${services.USERS_SERVICE}/users`,
      expect.objectContaining({
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
    axios.get.mockResolvedValue({ status: 200, data: { success: true, data: [{ name: 'Project Alpha' }] } });

    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(200);

    expect(axios.get).toHaveBeenCalledWith(
      `${services.PROJECTS_SERVICE}/projects`,
      expect.objectContaining({
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
    axios.get.mockResolvedValue({ status: 200, data: { success: true, data: [{ plantId: 'plant1' }] } });

    const response = await request(app)
      .get('/api/monitoring')
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(200);

    expect(axios.get).toHaveBeenCalledWith(
      `${services.MONITORING_SERVICE}/monitoring`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-user-id': testUserId,
          'x-user-role': testUserRole,
        }),
      })
    );
    expect(response.body.data[0]).toHaveProperty('plantId', 'plant1');
  });
});
