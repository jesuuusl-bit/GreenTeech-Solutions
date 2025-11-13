const userController = require('../src/controllers/userController');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const mongoose = require('mongoose'); // Remove global import

// Mock de los modelos y librerías
jest.mock('../src/models/User', () => {
  const mongoose = require('mongoose'); // Import mongoose inside the mock factory
  return {
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
  };
});
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Users Service - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  // Test para registerUser
  test('registerUser should create a new user', async () => {
    req.body = { name: 'Test User', email: 'test@example.com', password: 'password123', role: 'user' };
    bcrypt.hash.mockResolvedValue('hashedPassword');
    User.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId(), ...req.body, password: 'hashedPassword' });

    await userController.registerUser(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com',
      password: 'hashedPassword',
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ email: 'test@example.com' }),
    }));
    expect(res.json.mock.calls[0][0].data).toHaveProperty('name', 'Test User'); // toHaveProperty
  });

  // Test para loginUser
  test('loginUser should return a token for valid credentials', async () => {
    req.body = { email: 'login@example.com', password: 'password123' };
    const mockUser = { _id: new mongoose.Types.ObjectId(), email: 'login@example.com', password: 'hashedPassword', role: 'user' };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mockToken');
    process.env.JWT_SECRET = 'test_secret'; // Mock JWT_SECRET

    await userController.loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'login@example.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    expect(jwt.sign).toHaveBeenCalledWith(expect.objectContaining({ id: mockUser._id.toString() }), 'test_secret', { expiresIn: '1h' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      token: 'mockToken',
    }));
    expect(res.json.mock.calls[0][0].token).toBe('mockToken'); // toBe
  });

  // Test para getAllUsers
  test('getAllUsers should return all users', async () => {
    const mockUsers = [{ name: 'User A', _id: new mongoose.Types.ObjectId() }];
    User.find.mockReturnThis();
    User.populate.mockReturnThis();
    User.sort.mockResolvedValue(mockUsers);

    await userController.getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({ name: 'User A' }),
      ]),
    })); // toEqual con arrayContaining
    expect(res.json.mock.calls[0][0].data.length).toBe(1); // toBe
  });

  // Test para getUserStats
  test('getUserStats should return user statistics', async () => {
    User.countDocuments.mockResolvedValueOnce(10); // Total
    User.countDocuments.mockResolvedValueOnce(8);  // Active
    User.aggregate.mockResolvedValueOnce([{ _id: 'admin', count: 2 }]); // By role
    User.countDocuments.mockResolvedValueOnce(1);  // Recent

    await userController.getUserStats(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      total: 10,
      active: 8,
      byRole: expect.objectContaining({ admin: 2 }),
      recentUsers: 1,
    }));
    expect(res.json.mock.calls[0][0].byRole.admin).toBe(2); // toBe
    expect(res.json.mock.calls[0][0]).toHaveProperty('total'); // toHaveProperty
  });

  // Test para loginUser con credenciales inválidas
  test('loginUser should return 401 for invalid password', async () => {
    req.body = { email: 'login@example.com', password: 'wrongPassword' };
    const mockUser = { _id: new mongoose.Types.ObjectId(), email: 'login@example.com', password: 'hashedPassword', role: 'user' };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false); // Contraseña incorrecta
    process.env.JWT_SECRET = 'test_secret'; // Mock JWT_SECRET

    await userController.loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Credenciales inválidas'),
    })); // toContain
  });

  // Puedes añadir más tests unitarios aquí para update, delete, toggle status, etc.
});
