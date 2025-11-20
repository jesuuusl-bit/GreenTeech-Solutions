const request = require('supertest');
const app = require('../../projects-service/src/server'); // Importa tu app Express
const mongoose = require('mongoose');
const Project = require('../../projects-service/src/models/Project');
const Task = require('../../projects-service/src/models/Task');

// Mock de los modelos
jest.mock('../../projects-service/src/models/Project', () => ({
  find: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  findByIdAndDelete: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../projects-service/src/models/Task', () => ({
  find: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  findByIdAndDelete: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue(null),
}));

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

describe('Projects Service - Integration Tests', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(5002, () => {
      console.log('Projects Service running on port 5002 for integration tests');
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Project.find.mockReturnThis();
    Project.populate.mockReturnThis();
    Project.sort.mockResolvedValue([]);
    Project.findById.mockResolvedValue(null);
    Project.findByIdAndUpdate.mockResolvedValue(null);
    Project.findByIdAndDelete.mockResolvedValue(null);
    Project.create.mockResolvedValue(null);
    Task.find.mockReturnThis();
    Task.populate.mockReturnThis();
    Task.sort.mockResolvedValue([]);
    Task.findById.mockResolvedValue(null);
    Task.findByIdAndUpdate.mockResolvedValue(null);
    Task.findByIdAndDelete.mockResolvedValue(null);
    Task.create.mockResolvedValue(null);
  });

  // Test 1: GET /projects - Debería devolver una lista de proyectos
  test('GET /projects should return a list of projects', async () => {
    const mockProjects = [
      { _id: new mongoose.Types.ObjectId(), name: 'Project Alpha', description: 'Desc A' },
      { _id: new mongoose.Types.ObjectId(), name: 'Project Beta', description: 'Desc B' },
    ];
    const mockQuery = {
      sort: jest.fn().mockResolvedValue(mockProjects),
      limit: jest.fn().mockResolvedValue(mockProjects),
    };
    Project.find.mockReturnValue(mockQuery);

    const res = await request(app).get('/projects');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].name).toBe(mockProjects[0].name);
    expect(Project.find).toHaveBeenCalledTimes(1);
    expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  // Test 2: POST /projects - Debería crear un nuevo proyecto
  test('POST /projects should create a new project', async () => {
    const newProject = { name: 'New Project', description: 'New Desc', startDate: new Date().toISOString(), endDate: new Date().toISOString() };
    const mockSavedProject = { _id: new mongoose.Types.ObjectId(), ...newProject };
    Project.create.mockResolvedValue(mockSavedProject);

    const res = await request(app).post('/projects').send(newProject);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(mockSavedProject._id.toString());
    expect(res.body.data.name).toBe(newProject.name);
    expect(new Date(res.body.data.startDate).toISOString()).toEqual(newProject.startDate);
    expect(Project.create).toHaveBeenCalledWith(newProject);
  });

  // Test 3: GET /projects/:id - Debería devolver un proyecto por ID
  test('GET /projects/:id should return a project by ID', async () => {
    const projectId = new mongoose.Types.ObjectId();
    const mockProject = { _id: projectId, name: 'Project Gamma', description: 'Desc Gamma' };
    Project.findById.mockResolvedValue(mockProject);

    const res = await request(app).get(`/projects/${projectId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toEqual(mockProject._id.toString());
    expect(res.body.data.name).toEqual(mockProject.name);
    expect(Project.findById).toHaveBeenCalledWith(projectId.toString());
  });

  // Test 4: PUT /projects/:id - Debería actualizar un proyecto existente
  test('PUT /projects/:id should update an existing project', async () => {
    const projectId = new mongoose.Types.ObjectId();
    const updatedFields = { description: 'Updated Desc' };
    const mockUpdatedProject = { _id: projectId, name: 'Project Gamma', description: 'Updated Desc' };
    Project.findByIdAndUpdate.mockResolvedValue(mockUpdatedProject);

    const res = await request(app).put(`/projects/${projectId}`).send(updatedFields);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toEqual(mockUpdatedProject._id.toString());
    expect(res.body.data.description).toEqual(mockUpdatedProject.description);
    expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(projectId.toString(), updatedFields, { new: true, runValidators: true });
  });

  // Test 5: DELETE /projects/:id - Debería eliminar un proyecto
  test('DELETE /projects/:id should delete a project', async () => {
    const projectId = new mongoose.Types.ObjectId();
    Project.findByIdAndDelete.mockResolvedValue({ _id: projectId, name: 'Deleted Project' });

    const res = await request(app).delete(`/projects/${projectId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Proyecto eliminado exitosamente');
    expect(Project.findByIdAndDelete).toHaveBeenCalledWith(projectId.toString());
  });

  // Test 6: POST /tasks - Debería crear una nueva tarea
  test('POST /tasks should create a new task', async () => {
    const projectId = new mongoose.Types.ObjectId();
    const newTask = { name: 'New Task', description: 'Task Desc', projectId: projectId.toString() };
    const mockSavedTask = { _id: new mongoose.Types.ObjectId(), ...newTask };
    Task.create.mockResolvedValue(mockSavedTask);

    const res = await request(app).post('/tasks').send(newTask);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toEqual(mockSavedTask._id.toString());
    expect(res.body.data.projectId).toEqual(mockSavedTask.projectId.toString());
    expect(Task.create).toHaveBeenCalledWith(newTask);
  });

  // Test 7: GET /tasks/:id - Debería devolver una tarea por ID
  test('GET /tasks/:id should return a task by ID', async () => {
    const taskId = new mongoose.Types.ObjectId();
    const mockTask = { _id: taskId, name: 'Task Alpha', projectId: new mongoose.Types.ObjectId() };
    Task.findById.mockResolvedValue(mockTask);

    const res = await request(app).get(`/tasks/${taskId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toEqual(mockTask._id.toString());
    expect(Task.findById).toHaveBeenCalledWith(taskId.toString());
  });

  // Test 8: PUT /tasks/:id - Debería actualizar una tarea existente
  test('PUT /tasks/:id should update an existing task', async () => {
    const taskId = new mongoose.Types.ObjectId();
    const updatedFields = { status: 'completed' };
    const mockUpdatedTask = { _id: taskId, name: 'Task Alpha', status: 'completed' };
    Task.findByIdAndUpdate.mockResolvedValue(mockUpdatedTask);

    const res = await request(app).put(`/tasks/${taskId}`).send(updatedFields);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toEqual(mockUpdatedTask._id.toString());
    expect(res.body.data.status).toEqual(mockUpdatedTask.status);
    expect(Task.findByIdAndUpdate).toHaveBeenCalledWith(taskId.toString(), updatedFields, { new: true, runValidators: true });
  });

  // Test 9: DELETE /tasks/:id - Debería eliminar una tarea
  test('DELETE /tasks/:id should delete a task', async () => {
    const taskId = new mongoose.Types.ObjectId();
    Task.findByIdAndDelete.mockResolvedValue({ _id: taskId, name: 'Deleted Task' });

    const res = await request(app).delete(`/tasks/${taskId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Tarea eliminada exitosamente');
    expect(Task.findByIdAndDelete).toHaveBeenCalledWith(taskId.toString());
  });

  // Test 10: GET /health - Debería devolver el estado de salud
  test('GET /health should return health status', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('projects-service');
    expect(res.body.status).toBe('healthy');
  });
});
