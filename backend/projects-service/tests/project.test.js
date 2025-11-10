describe('Projects Service', () => {
  test('should pass basic test', () => {
    expect(true).toBe(true);
  });

  test('should have Project model', () => {
    const Project = require('../src/models/Project');
    expect(Project).toBeDefined();
  });

  test('should have Task model', () => {
    const Task = require('../src/models/Task');
    expect(Task).toBeDefined();
  });
});

module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!**/node_modules/**'
  ]
};