const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server'); // Importa tu aplicación Express
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Users Service - Integration Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/testdb_users';
    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test de integración 1: Registrar un nuevo usuario exitosamente
  test('POST /users/register should register a new user', async () => {
    const newUser = { name: 'Integration User', email: 'integration@example.com', password: 'password123', role: 'user' };
    const response = await request(app)
      .post('/users/register')
      .send(newUser)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data.email).toBe(newUser.email); // toBe
    expect(response.body.data).toHaveProperty('role', 'user'); // toHaveProperty

    const userInDb = await User.findById(response.body.data._id);
    expect(userInDb).not.toBeNull();
    expect(await bcrypt.compare(newUser.password, userInDb.password)).toBe(true);
  });

  // Test de integración 2: Iniciar sesión con credenciales válidas
  test('POST /users/login should return a token for valid credentials', async () => {
    const password = 'securePassword';
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name: 'Login User', email: 'login@example.com', password: hashedPassword, role: 'user' });

    const credentials = { email: 'login@example.com', password: password };
    const response = await request(app)
      .post('/users/login')
      .send(credentials)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('token'); // toHaveProperty
    expect(response.body.token).toContain('ey'); // toContain (JWTs start with ey)
  });

  // Test de integración 3: Iniciar sesión con credenciales inválidas
  test('POST /users/login should return 401 for invalid credentials', async () => {
    const password = 'securePassword';
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name: 'Login User', email: 'invalid@example.com', password: hashedPassword, role: 'user' });

    const credentials = { email: 'invalid@example.com', password: 'wrongPassword' };
    const response = await request(app)
      .post('/users/login')
      .send(credentials)
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.message).toContain('Credenciales inválidas'); // toContain
  });

  // Test de integración 4: Obtener todos los usuarios (requiere autenticación)
  test('GET /users should return all users for an authenticated request', async () => {
    const password = 'adminPassword';
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await User.create({ name: 'Admin User', email: 'admin@example.com', password: hashedPassword, role: 'admin' });
    const token = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await User.create({ name: 'Regular User', email: 'regular@example.com', password: 'password123', role: 'user' });

    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data.length).toBe(2); // toBe
    expect(response.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: 'admin@example.com' }),
      expect.objectContaining({ email: 'regular@example.com' }),
    ])); // toEqual con arrayContaining
  });

  // Test de integración 5: Actualizar un usuario (requiere autenticación y autorización)
  test('PATCH /users/:id should update a user by admin', async () => {
    const password = 'adminPassword';
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await User.create({ name: 'Admin User', email: 'admin@example.com', password: hashedPassword, role: 'admin' });
    const token = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const userToUpdate = await User.create({ name: 'Old Name', email: 'update@example.com', password: 'password123', role: 'user' });

    const response = await request(app)
      .patch(`/users/${userToUpdate._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name', role: 'manager' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data.name).toBe('New Name'); // toBe
    expect(response.body.data.role).toBe('manager'); // toBe
  });

  // Test de integración 6: Acceso no autorizado a /users (sin token)
  test('GET /users should return 401 if no auth token is provided', async () => {
    await request(app)
      .get('/users')
      .expect(401); // Expect 401 Unauthorized
  });
});
