const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server'); // Importa tu aplicación Express
const ProductionData = require('../src/models/ProductionData');
const Alert = require('../src/models/Alert');
const User = require('../../users-service/src/models/User'); // Necesario para simular usuario autenticado

describe('Monitoring Service - Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/testdb_monitoring';
    await mongoose.connect(mongoUri);

    // Crear un usuario de prueba y obtener un token para simular autenticación
    testUser = await User.create({
      name: 'Monitor User',
      email: 'monitor@example.com',
      password: 'password123',
      role: 'user'
    });
    // Aquí deberías generar un JWT válido para testUser
    // Por simplicidad, usaremos un placeholder o mockearemos la autenticación en el API Gateway
    authToken = 'Bearer mock_token_for_monitor_user';
  });

  afterEach(async () => {
    await ProductionData.deleteMany({});
    await Alert.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({}); // Limpiar usuario de prueba
    await mongoose.connection.close();
  });

  // Test de integración 1: Crear datos de producción y verificar alerta
  test('POST /monitoring should create production data and a medium alert for low efficiency', async () => {
    const newProduction = { plantId: 'plantX', value: 120, efficiency: 65 };
    const response = await request(app)
      .post('/monitoring')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .send(newProduction)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('plantId', 'plantX');

    const alerts = await Alert.find({ plantId: 'plantX' });
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe('medium'); // toBe
    expect(alerts[0].type).toContain('low-production'); // toContain
  });

  // Test de integración 2: Crear datos de producción y verificar alerta de alta severidad
  test('POST /monitoring should create production data and a high alert for very low efficiency', async () => {
    const newProduction = { plantId: 'plantY', value: 80, efficiency: 45 };
    await request(app)
      .post('/monitoring')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .send(newProduction)
      .expect(201);

    const alerts = await Alert.find({ plantId: 'plantY' });
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe('high'); // toBe
  });

  // Test de integración 3: Obtener datos de producción
  test('GET /monitoring should return production data', async () => {
    await ProductionData.create({ plantId: 'plantZ', value: 150, efficiency: 90 });
    const response = await request(app)
      .get('/monitoring')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .expect(200);

    expect(response.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ plantId: 'plantZ' }),
    ])); // toEqual con arrayContaining
    expect(response.body).toHaveProperty('success', true); // toHaveProperty
  });

  // Test de integración 4: Actualizar datos de producción
  test('PATCH /monitoring/production/:id should update production data', async () => {
    const existingData = await ProductionData.create({ plantId: 'plantW', value: 100, efficiency: 70 });
    const updatedEfficiency = 80;
    const response = await request(app)
      .patch(`/monitoring/production/${existingData._id}`)
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .send({ efficiency: updatedEfficiency })
      .expect(200);

    expect(response.body.data.efficiency).toBe(updatedEfficiency); // toBe
    const updatedInDb = await ProductionData.findById(existingData._id);
    expect(updatedInDb.efficiency).toBe(updatedEfficiency);
  });

  // Test de integración 5: Obtener alertas
  test('GET /alerts should return alerts', async () => {
    await Alert.create({ plantId: 'plantAlert', type: 'low-production', severity: 'medium' });
    const response = await request(app)
      .get('/alerts')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].plantId).toBe('plantAlert'); // toBe
    expect(response.body.data[0]).toHaveProperty('severity', 'medium'); // toHaveProperty
  });

  // Test de integración 6: Acceso no autorizado
  test('GET /monitoring should return 401 if no auth token is provided', async () => {
    await request(app)
      .get('/monitoring')
      .expect(401); // Expect 401 Unauthorized
  });
});
