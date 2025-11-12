const userController = require('../src/controllers/userController');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock de los modelos y librerías
jest.mock('../src/models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Users Service - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  // Test para registerUser
  test('registerUser should create a new user', async () => {
    req.body = { name: 'Test User', email: 'test@example.com', password: 'password123', role: 'user' };
    bcrypt.hash.mockResolvedValue('hashedPassword');
    User.create.mockResolvedValue({ _id: 'userId123', ...req.body, password: 'hashedPassword' });

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
    const mockUser = { _id: 'loginId', email: 'login@example.com', password: 'hashedPassword', role: 'user' };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mockToken');

    await userController.loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'login@example.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    expect(jwt.sign).toHaveBeenCalledWith(expect.objectContaining({ id: 'loginId' }), process.env.JWT_SECRET, { expiresIn: '1h' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      token: 'mockToken',
    }));
    expect(res.json.mock.calls[0][0].token).toBe('mockToken'); // toBe
  });

  // Test para getAllUsers
  test('getAllUsers should return all users', async () => {
    const mockUsers = [{ name: 'User A' }, { name: 'User B' }];
    User.find.mockResolvedValue(mockUsers);

    await userController.getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockUsers,
    }));
    expect(res.json.mock.calls[0][0].data).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'User A' }),
    ])); // toEqual con arrayContaining
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
    const mockUser = { _id: 'loginId', email: 'login@example.com', password: 'hashedPassword', role: 'user' };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false); // Contraseña incorrecta

    await userController.loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Credenciales inválidas'),
    })); // toContain
  });

  // Puedes añadir más tests unitarios aquí para update, delete, toggle status, etc.
});