describe('Users Service', () => {
  test('should pass basic test', () => {
    expect(true).toBe(true);
  });

  test('should have User model', () => {
    const User = require('../src/models/User');
    expect(User).toBeDefined();
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