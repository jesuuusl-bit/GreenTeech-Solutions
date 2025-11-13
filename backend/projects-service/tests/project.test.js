const projectController = require('../src/controllers/projectController');
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');
const mongoose = require('mongoose'); // Re-add global import

// Mock de los modelos
jest.mock('../src/models/Project', () => {
  const mongoose = require('mongoose'); // Import mongoose inside the mock factory
  return {
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findByIdAndUpdate: jest.fn().mockResolvedValue(null),
    findByIdAndDelete: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(null),
  };
});
jest.mock('../src/models/Task', () => {
  const mongoose = require('mongoose'); // Import mongoose inside the mock factory
  return {
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findByIdAndUpdate: jest.fn().mockResolvedValue(null),
    findByIdAndDelete: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(null),
  };
});

describe('Projects Service - Unit Tests', () => {
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

  // Test para createProject
  test('createProject should create a new project', async () => {
    req.body = { name: 'New Project', description: 'Desc', startDate: new Date(), endDate: new Date() };
    const mockSavedProject = { _id: new mongoose.Types.ObjectId(), ...req.body };
    Project.create.mockResolvedValue(mockSavedProject);

    await projectController.createProject(req, res);

    expect(Project.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockSavedProject,
    }));
    expect(res.json.mock.calls[0][0].data).toHaveProperty('name', 'New Project'); // toHaveProperty
  });

  // Test para getProjectById
  test('getProjectById should return a single project', async () => {
    req.params = { id: new mongoose.Types.ObjectId().toString() };
    const mockProject = { _id: req.params.id, name: 'Project Gamma' };
    Project.findById.mockResolvedValue(mockProject);

    await projectController.getProjectById(req, res);

    expect(Project.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockProject,
    }));
    expect(res.json.mock.calls[0][0].data.name).toBe('Project Gamma'); // toBe
  });
});