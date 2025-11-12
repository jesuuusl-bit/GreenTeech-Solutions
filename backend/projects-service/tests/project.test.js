const projectController = require('../src/controllers/projectController');
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');
const mongoose = require('mongoose');

// Mock de los modelos
jest.mock('../src/models/Project');
jest.mock('../src/models/Task');

describe('Projects Service - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  // Test para getAllProjects
  test('getAllProjects should return all projects', async () => {
    const mockProjects = [{ name: 'Project Alpha' }, { name: 'Project Beta' }];
    Project.find.mockResolvedValue(mockProjects);

    await projectController.getAllProjects(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockProjects,
    }));
    expect(res.json.mock.calls[0][0].data).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Project Alpha' }),
    ])); // toEqual con arrayContaining
  });

  // Test para createProject
  test('createProject should create a new project', async () => {
    req.body = { name: 'New Project', description: 'Desc', startDate: new Date(), endDate: new Date() };
    const mockSavedProject = { _id: 'projId', ...req.body };
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
    req.params = { id: 'projectId123' };
    const mockProject = { _id: 'projectId123', name: 'Project Gamma' };
    Project.findById.mockResolvedValue(mockProject);

    await projectController.getProjectById(req, res);

    expect(Project.findById).toHaveBeenCalledWith('projectId123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockProject,
    }));
    expect(res.json.mock.calls[0][0].data.name).toBe('Project Gamma'); // toBe
  });

  // Test para updateProject
  test('updateProject should update an existing project', async () => {
    req.params = { id: 'projectId123' };
    req.body = { description: 'Updated Desc' };
    const mockUpdatedProject = { _id: 'projectId123', name: 'Project Gamma', description: 'Updated Desc' };
    Project.findByIdAndUpdate.mockResolvedValue(mockUpdatedProject);

    await projectController.updateProject(req, res);

    expect(Project.findByIdAndUpdate).toHaveBeenCalledWith('projectId123', req.body, { new: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: mockUpdatedProject,
    }));
    expect(res.json.mock.calls[0][0].data.description).toContain('Updated'); // toContain
  });

  // Puedes añadir más tests unitarios aquí para tareas, etc.
});