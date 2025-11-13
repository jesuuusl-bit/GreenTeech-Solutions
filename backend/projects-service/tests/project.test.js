const projectController = require('../src/controllers/projectController');
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');
const mongoose = require('mongoose');

// Mock de los modelos
jest.mock('../src/models/Project', () => ({
  find: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  findByIdAndDelete: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue(null),
}));
jest.mock('../src/models/Task', () => ({
  find: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  findByIdAndDelete: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue(null),
}));

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

  // Test para getAllProjects
  test('getAllProjects should return all projects', async () => {
    const mockProjects = [{ name: 'Project Alpha', _id: new mongoose.Types.ObjectId() }];
    Project.find.mockReturnThis();
    Project.populate.mockReturnThis();
    Project.sort.mockResolvedValue(mockProjects);

    await projectController.getAllProjects(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({ name: 'Project Alpha' }),
      ]),
    })); // toEqual con arrayContaining
    expect(res.json.mock.calls[0][0].data.length).toBe(1); // toBe
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

  // Test para updateProject
  test('updateProject should update an existing project', async () => {
    req.params = { id: new mongoose.Types.ObjectId().toString() };
    req.body = { description: 'Updated Desc' };
    const mockUpdatedProject = { _id: req.params.id, name: 'Project Gamma', description: 'Updated Desc' };
    Project.findByIdAndUpdate.mockResolvedValue(mockUpdatedProject);

    await projectController.updateProject(req, res);

    expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(req.params.id, req.body, { new: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockUpdatedProject,
    }));
    expect(res.json.mock.calls[0][0].data.description).toContain('Updated'); // toContain
  });

  // Test para deleteTask
  test('deleteTask should delete an existing task', async () => {
    req.params = { id: new mongoose.Types.ObjectId().toString() };
    const mockDeletedTask = { _id: req.params.id, name: 'Task to Delete' };
    Task.findByIdAndDelete.mockResolvedValue(mockDeletedTask);

    await projectController.deleteTask(req, res);

    expect(Task.findByIdAndDelete).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Tarea eliminada exitosamente',
    }));
    expect(res.json.mock.calls[0][0].message).toContain('eliminada'); // toContain
  });

  // Puedes añadir más tests unitarios aquí para tareas, etc.
});
