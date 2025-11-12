const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server'); // Importa tu aplicación Express
const Document = require('../src/models/Document'); // Tu modelo de documento
const User = require('../../users-service/src/models/User'); // Necesario para uploadedBy

describe('Documents Service - Integration Tests', () => {
  let testUser;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/testdb_documents';
    await mongoose.connect(mongoUri);

    // Crear un usuario de prueba para las pruebas de documentos
    testUser = await User.create({
      name: 'Test User',
      email: 'test.user@example.com',
      password: 'password123',
      role: 'user'
    });
  });

  afterEach(async () => {
    await Document.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({}); // Limpiar usuario de prueba
    await mongoose.connection.close();
  });

  // Test de integración 1: Obtener todos los documentos (inicialmente vacío)
  test('GET /documents should return an empty array initially', async () => {
    const response = await request(app).get('/documents').expect(200);
    expect(response.body.data).toEqual([]); // toEqual
    expect(response.body).toHaveProperty('success', true); // toHaveProperty
  });

  // Test de integración 2: Subir un documento exitosamente
  test('POST /documents/upload should upload a document', async () => {
    const filePath = `${__dirname}/test_upload.txt`;
    const fs = require('fs');
    fs.writeFileSync(filePath, 'Contenido de prueba para el documento.');

    const response = await request(app)
      .post('/documents/upload')
      .set('x-user-id', testUser._id.toString()) // Simular el header del API Gateway
      .set('x-user-role', testUser.role)
      .attach('document', filePath)
      .field('title', 'Mi Documento de Prueba')
      .field('type', 'report')
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('title', 'Mi Documento de Prueba');
    expect(response.body.data.fileName).toBe('test_upload.txt'); // toBe
    expect(response.body.data.uploadedBy.toString()).toBe(testUser._id.toString()); // toBe
    expect(response.body.data.fileUrl).toContain('/uploads/test_upload.txt'); // toContain

    const savedDoc = await Document.findById(response.body.data._id);
    expect(savedDoc).not.toBeNull();

    fs.unlinkSync(filePath);
  });

  // Test de integración 3: Subir un documento sin título (debería fallar por validación)
  test('POST /documents/upload should return 400 if title is missing', async () => {
    const filePath = `${__dirname}/test_upload_no_title.txt`;
    const fs = require('fs');
    fs.writeFileSync(filePath, 'Contenido de prueba.');

    const response = await request(app)
      .post('/documents/upload')
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .attach('document', filePath)
      .field('type', 'report')
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('title: Path `title` is required'); // toContain

    fs.unlinkSync(filePath);
  });

  // Test de integración 4: Subir un documento con tipo no soportado (debería fallar por Multer)
  test('POST /documents/upload should return 400 if file type is not supported', async () => {
    const filePath = `${__dirname}/test_upload.html`; // HTML no soportado
    const fs = require('fs');
    fs.writeFileSync(filePath, '<html><body>Hello</body></html>');

    const response = await request(app)
      .post('/documents/upload')
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .attach('document', filePath)
      .field('title', 'HTML Document')
      .field('type', 'other')
      .expect(400); // Multer debería devolver 400

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.message).toContain('Tipo de archivo no soportado'); // toContain

    fs.unlinkSync(filePath);
  });

  // Test de integración 5: Obtener documentos después de subir uno
  test('GET /documents should return uploaded document', async () => {
    const filePath = `${__dirname}/test_get_doc.txt`;
    const fs = require('fs');
    fs.writeFileSync(filePath, 'Contenido para GET.');

    await request(app)
      .post('/documents/upload')
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .attach('document', filePath)
      .field('title', 'Documento para GET')
      .field('type', 'manual')
      .expect(201);

    const response = await request(app).get('/documents').expect(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].title).toBe('Documento para GET');
    expect(response.body.data[0]).toHaveProperty('uploadedBy'); // toHaveProperty

    fs.unlinkSync(filePath);
  });

  // Test de integración 6: Acceso no autorizado a /documents/upload
  test('POST /documents/upload should return 401 if no user token is provided', async () => {
    const filePath = `${__dirname}/test_unauth.txt`;
    const fs = require('fs');
    fs.writeFileSync(filePath, 'Contenido.');

    const response = await request(app)
      .post('/documents/upload')
      .attach('document', filePath)
      .field('title', 'Unauthorized Doc')
      .field('type', 'other')
      .expect(401); // Espera 401 Unauthorized

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.message).toContain('No autorizado'); // toContain

    fs.unlinkSync(filePath);
  });
});