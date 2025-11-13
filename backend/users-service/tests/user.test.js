const userController = require('../src/controllers/userController');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // Re-add global import

// Mock de los modelos y librerías
jest.mock('../src/models/User', () => {
  const mongoose = require('mongoose');
  const MockUser = jest.fn(); // This will be our mock constructor

  // Mock static methods
  MockUser.findOne = jest.fn().mockResolvedValue(null);
  MockUser.create = jest.fn().mockResolvedValue(null);
  MockUser.find = jest.fn().mockReturnThis();
  MockUser.populate = jest.fn().mockReturnThis();
  MockUser.sort = jest.fn().mockResolvedValue([]);
  MockUser.countDocuments = jest.fn().mockResolvedValue(0);
  MockUser.aggregate = jest.fn().mockResolvedValue([]);
  MockUser.findById = jest.fn().mockResolvedValue(null);
  MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
  MockUser.findByIdAndDelete = jest.fn().mockResolvedValue(null);

  // Default implementation for the constructor (if new User() is ever called)
  MockUser.mockImplementation((data) => ({
    ...data,
    _id: new mongoose.Types.ObjectId(),
    save: jest.fn().mockResolvedValue(data), // Default save behavior
    comparePassword: jest.fn().mockResolvedValue(true), // Mock comparePassword
  }));

  return MockUser;
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
  test('register should create a new user', async () => {
    req.body = { name: 'Test User', email: 'test@example.com', password: 'password123', role: 'user' };
    bcrypt.hash.mockResolvedValue('hashedPassword');
    User.findOne.mockResolvedValue(null); // Ensure user does not exist
    User.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId(), ...req.body, password: 'hashedPassword' });

    await userController.register(req, res); // Corrected function name

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
  test('login should return a token for valid credentials', async () => {
    req.body = { email: 'login@example.com', password: 'password123' };
    const mockUser = { _id: new mongoose.Types.ObjectId(), email: 'login@example.com', password: 'hashedPassword', role: 'user', isActive: true, comparePassword: jest.fn().mockResolvedValue(true), save: jest.fn() };
    User.findOne.mockResolvedValue(mockUser);
    // bcrypt.compare.mockResolvedValue(true); // Mocked in MockUser.comparePassword
    jwt.sign.mockReturnValue('mockToken');
    process.env.JWT_SECRET = 'test_secret'; // Mock JWT_SECRET

    await userController.login(req, res); // Corrected function name

    expect(User.findOne).toHaveBeenCalledWith({ email: 'login@example.com' });
    expect(mockUser.comparePassword).toHaveBeenCalledWith('password123'); // Use mockUser's comparePassword
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
    const mockUsers = [{ name: 'User A', _id: new mongoose.Types.ObjectId(), isActive: true }];
    User.find.mockReturnThis();
    User.sort.mockResolvedValue(mockUsers); // populate is not called in controller

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
    User.aggregate.mockResolvedValueOnce([{ _id: 'IT', count: 3 }]); // By department
    User.countDocuments.mockResolvedValueOnce(1);  // Recent

    await userController.getUserStats(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        total: 10,
        active: 8,
        byRole: expect.objectContaining({ admin: 2 }),
        byDepartment: expect.objectContaining({ IT: 3 }),
        recentUsers: 1,
      }),
    }));
    expect(res.json.mock.calls[0][0].data.byRole.admin).toBe(2); // toBe
    expect(res.json.mock.calls[0][0].data).toHaveProperty('total'); // toHaveProperty
  });

  // Test para loginUser con credenciales inválidas
  test('login should return 401 for invalid password', async () => {
    req.body = { email: 'login@example.com', password: 'wrongPassword' };
    const mockUser = { _id: new mongoose.Types.ObjectId(), email: 'login@example.com', password: 'hashedPassword', role: 'user', isActive: true, comparePassword: jest.fn().mockResolvedValue(false) };
    User.findOne.mockResolvedValue(mockUser);
    // bcrypt.compare.mockResolvedValue(false); // Mocked in MockUser.comparePassword
    process.env.JWT_SECRET = 'test_secret'; // Mock JWT_SECRET

    await userController.login(req, res); // Corrected function name

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Credenciales inválidas'),
    })); // toContain
  });

  // Puedes añadir más tests unitarios aquí para update, delete, toggle status, etc.
});
