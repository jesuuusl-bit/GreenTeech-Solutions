const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server'); // Importa tu aplicación Express
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');
const User = require('../../users-service/src/models/User'); // Necesario para simular usuario autenticado

describe('Projects Service - Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/testdb_projects';
    await mongoose.connect(mongoUri);

    testUser = await User.create({
      name: 'Project User',
      email: 'project@example.com',
      password: 'password123',
      role: 'user'
    });
    authToken = 'Bearer mock_token_for_project_user';
  });

  afterEach(async () => {
    await Project.deleteMany({});
    await Task.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // Test de integración 1: Crear un proyecto exitosamente
  test('POST /projects should create a new project', async () => {
    const newProject = { name: 'New Test Project', description: 'A project for testing', startDate: new Date(), endDate: new Date() };
    const response = await request(app)
      .post('/projects')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .send(newProject)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('name', 'New Test Project'); // toHaveProperty
    expect(response.body.data.description).toBe(newProject.description); // toBe
  });

  // Test de integración 2: Obtener todos los proyectos
  test('GET /projects should return all projects', async () => {
    await Project.create({ name: 'Existing Project 1', description: 'Desc 1', startDate: new Date(), endDate: new Date() });
    await Project.create({ name: 'Existing Project 2', description: 'Desc 2', startDate: new Date(), endDate: new Date() });

    const response = await request(app)
      .get('/projects')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .expect(200);

    expect(response.body.data.length).toBe(2);
    expect(response.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Existing Project 1' }),
      expect.objectContaining({ name: 'Existing Project 2' }),
    ])); // toEqual con arrayContaining
  });

  // Test de integración 3: Obtener un proyecto por ID
  test('GET /projects/:id should return a single project', async () => {
    const project = await Project.create({ name: 'Single Project', description: 'Desc', startDate: new Date(), endDate: new Date() });

    const response = await request(app)
      .get(`/projects/${project._id}`)
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .expect(200);

    expect(response.body.data.name).toBe('Single Project'); // toBe
    expect(response.body).toHaveProperty('success', true); // toHaveProperty
  });

  // Test de integración 4: Actualizar un proyecto
  test('PATCH /projects/:id should update a project', async () => {
    const project = await Project.create({ name: 'Project to Update', description: 'Old Desc', startDate: new Date(), endDate: new Date() });
    const updatedDescription = 'New Description';

    const response = await request(app)
      .patch(`/projects/${project._id}`)
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .send({ description: updatedDescription })
      .expect(200);

    expect(response.body.data.description).toBe(updatedDescription); // toBe
    const updatedProject = await Project.findById(project._id);
    expect(updatedProject.description).toBe(updatedDescription);
  });

  // Test de integración 5: Crear una tarea para un proyecto
  test('POST /tasks should create a new task for a project', async () => {
    const project = await Project.create({ name: 'Project for Task', description: 'Desc', startDate: new Date(), endDate: new Date() });
    const newTask = { projectId: project._id, name: 'New Task', description: 'Task Desc', status: 'pending' };

    const response = await request(app)
      .post('/tasks')
      .set('Authorization', authToken)
      .set('x-user-id', testUser._id.toString())
      .set('x-user-role', testUser.role)
      .send(newTask)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data.name).toBe('New Task'); // toBe
    expect(response.body.data.projectId.toString()).toBe(project._id.toString()); // toBe
  });

  // Test de integración 6: Acceso no autorizado
  test('GET /projects should return 401 if no auth token is provided', async () => {
    await request(app)
      .get('/projects')
      .expect(401); // Expect 401 Unauthorized
  });
});
