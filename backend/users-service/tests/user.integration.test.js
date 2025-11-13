const request = require('supertest');
const app = require('../../users-service/src/server'); // Importa tu app Express
const mongoose = require('mongoose');
const User = require('../../users-service/src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock de los modelos y librerías
jest.mock('../../users-service/src/models/User', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue([]),
  countDocuments: jest.fn().mockResolvedValue(0),
  aggregate: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  findByIdAndDelete: jest.fn().mockResolvedValue(null),
  // Mock del constructor para new User()
  mockImplementation: jest.fn((data) => ({
    ...data,
    _id: new mongoose.Types.ObjectId(),
    save: jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(), ...data }),
    comparePassword: jest.fn().mockResolvedValue(true),
  })),
}));
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Mock de mongoose.connect para evitar la conexión real a la DB
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  connect: jest.fn(() => Promise.resolve()),
  connection: {
    readyState: 1,
    on: jest.fn(),
    once: jest.fn(),
  },
  Schema: jest.requireActual('mongoose').Schema,
  model: jest.requireActual('mongoose').model,
  Types: {
    ObjectId: jest.requireActual('mongoose').Types.ObjectId,
  },
}));

describe('Users Service - Integration Tests', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(5001, () => {
      console.log('Users Service running on port 5001 for integration tests');
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(null);
    User.find.mockReturnThis();
    User.populate.mockReturnThis();
    User.sort.mockResolvedValue([]);
    User.countDocuments.mockResolvedValue(0);
    User.aggregate.mockResolvedValue([]);
    User.findById.mockResolvedValue(null);
    User.findByIdAndUpdate.mockResolvedValue(null);
    User.findByIdAndDelete.mockResolvedValue(null);
    User.mockImplementation.mockClear();
    bcrypt.hash.mockResolvedValue('hashedPassword');
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mockToken');
    process.env.JWT_SECRET = 'test_secret';
  });

  // Test 1: POST /users/register - Debería registrar un nuevo usuario
  test('POST /users/register should register a new user', async () => {
    const userData = { name: 'Test User', email: 'test@example.com', password: 'password123', role: 'user' };
    const mockSavedUser = { _id: new mongoose.Types.ObjectId(), ...userData, password: 'hashedPassword' };
    User.create.mockResolvedValue(mockSavedUser);

    const res = await request(app).post('/users/register').send(userData);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('email', 'test@example.com');
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com',
      password: 'password123', // El controlador recibe la contraseña sin hash
    }));
  });

  // Test 2: POST /users/login - Debería autenticar un usuario y devolver un token
  test('POST /users/login should authenticate a user and return a token', async () => {
    const loginData = { email: 'admin@greentech.com', password: 'admin123' };
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: loginData.email,
      password: 'hashedPassword',
      role: 'admin',
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(mockUser);

    const res = await request(app).post('/users/login').send(loginData);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('data.token', 'mockToken');
    expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
    expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
    expect(jwt.sign).toHaveBeenCalledWith(expect.objectContaining({ id: mockUser._id.toString(), role: mockUser.role }), 'test_secret', { expiresIn: '1h' });
  });

  // Test 3: GET /users - Debería devolver una lista de usuarios
  test('GET /users should return a list of users', async () => {
    const mockUsers = [
      { _id: new mongoose.Types.ObjectId(), name: 'User A', email: 'a@example.com', role: 'user' },
      { _id: new mongoose.Types.ObjectId(), name: 'User B', email: 'b@example.com', role: 'admin' },
    ];
    User.find.mockReturnThis();
    User.sort.mockResolvedValue(mockUsers);

    const res = await request(app).get('/users');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockUsers);
    expect(User.find).toHaveBeenCalledTimes(1);
  });

  // Test 4: GET /users/stats - Debería devolver estadísticas de usuario
  test('GET /users/stats should return user statistics', async () => {
    User.countDocuments.mockResolvedValueOnce(10); // Total
    User.countDocuments.mockResolvedValueOnce(8);  // Active
    User.aggregate.mockResolvedValueOnce([{ _id: 'admin', count: 2 }]); // By role
    User.aggregate.mockResolvedValueOnce([{ _id: 'IT', count: 3 }]); // By department
    User.countDocuments.mockResolvedValueOnce(1);  // Recent

    const res = await request(app).get('/users/stats');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total', 10);
    expect(res.body.data).toHaveProperty('active', 8);
    expect(res.body.data.byRole).toEqual({ admin: 2 });
  });

  // Test 5: GET /health - Debería devolver el estado de salud
  test('GET /health should return health status', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('users-service');
    expect(res.body.status).toBe('healthy');
  });
});
