const request = require('supertest');
const app = require('../src/app'); // Importa tu app Express desde el nuevo app.js
const services = require('../src/config/services'); // Para acceder a las URLs de los servicios
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const mockDocumentsService = require('./mock-documents-service'); // Import mock documents service

// Define un JWT_SECRET para el entorno de pruebas
process.env.JWT_SECRET = 'test_jwt_secret'; 
process.env.USERS_SERVICE_URL = 'http://localhost:5001'; // Mock user service URL
process.env.DOCUMENTS_SERVICE_URL = 'http://localhost:5005'; // Mock documents service URL

describe('API Gateway - Unit Tests', () => {

  // Ejemplo de test unitario para una función auxiliar (si existiera)
  test('should return true for a valid service URL', () => {
    const isValidServiceUrl = (url) => url.startsWith('http');
    expect(isValidServiceUrl(services.USERS_SERVICE)).toBe(true);
  });

  // Ejemplo de test unitario para un objeto de configuración
  test('should have a USERS_SERVICE property', () => {
    expect(services).toHaveProperty('USERS_SERVICE');
    expect(services.USERS_SERVICE).toContain('http');
  });

  // Puedes añadir más tests unitarios para middlewares o funciones auxiliares aquí
});

describe('API Gateway - Integration Tests', () => {
  let testUserToken;
  const testUserId = '60d5ec49f8c7a10015a4b7c8'; // Un ID de usuario de prueba
  const testUserRole = 'admin'; // Un rol de usuario de prueba
  let mockDocumentsServer; // Para la instancia del servidor mock

  beforeAll((done) => {
    // Generar un token JWT válido para el usuario de prueba
    testUserToken = jwt.sign({ id: testUserId, role: testUserRole }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Iniciar el mock documents-service
    mockDocumentsServer = mockDocumentsService.listen(5005, () => {
      console.log('Mock Documents Service running on port 5005');
      done();
    });
  });

  afterAll((done) => {
    // Cerrar el mock documents-service
    mockDocumentsServer.close(done);
  });

  // Nota: Los tests de integración del API Gateway son complejos porque requieren que los microservicios estén corriendo.
  // Para un entorno de CI/CD, esto a menudo se maneja con Docker Compose o mocks de los servicios downstream.
  // Aquí, simularemos una llamada a una ruta que debería ser proxyada.

  // Test de integración 1: Health check del users-service (debería ser proxyado)
  test('GET /api/users/health should proxy to users-service health endpoint', async () => {
    // Para que este test funcione, el users-service DEBE estar corriendo y accesible
    // o debes mockear la llamada a axios dentro de proxyRequest.
    // Por simplicidad, aquí asumimos que axios.get al users-service health endpoint funcionaría.

    // Mockear axios para evitar llamadas reales a servicios externos en CI/CD
    // jest.mock('axios');
    // axios.get.mockResolvedValue({ status: 200, data: { status: 'healthy' } });

    const response = await request(app)
      .get('/api/users/health')
      .expect(200); // Espera un status 200 si el proxy funciona y el servicio responde

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('service', 'users-service');
  });

  // Test de integración 2: Ruta de login (debería ser proxyada)
  test('POST /api/users/login should proxy to users-service login endpoint', async () => {
    // Similar al anterior, requiere que users-service esté corriendo o axios mockeado.
    // Aquí solo probamos que el API Gateway reenvía la solicitud.
    const credentials = { email: 'test@example.com', password: 'password123' };
    const response = await request(app)
      .post('/api/users/login')
      .send(credentials)
      .expect(401); // Asumiendo que sin un mock, el users-service devolvería 401 o 500
    
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('No autorizado'); // O el mensaje de error esperado del users-service
  });

  // Test de integración 3: Subida de documentos (requiere multer y form-data)
  test('POST /api/documents/upload should proxy file upload to documents-service', async () => {
    // Este test es más complejo y requiere mockear el documents-service o tenerlo corriendo.
    // También requiere que el API Gateway tenga multer configurado para parsear el archivo.
    const filePath = `${__dirname}/test_file.txt`; // Crea un archivo de prueba temporal
    const fs = require('fs');
    fs.writeFileSync(filePath, 'This is a test file content.');

    const response = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${testUserToken}`) // Add Authorization header
      .attach('document', filePath) // 'document' es el nombre del campo del archivo
      .field('title', 'Test Document')
      .field('type', 'other')
      .expect(201); // Espera 201 si el documents-service lo procesa

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('title', 'Test Document');

    fs.unlinkSync(filePath); // Limpia el archivo de prueba
  });

  // Añade más tests de integración aquí para otras rutas proxyadas
});


