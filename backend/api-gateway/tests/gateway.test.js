const services = require('../src/config/services');

describe('API Gateway - Unit Tests', () => {

  // Test para verificar que las URLs de los servicios están definidas y son strings
  test('should have defined service URLs', () => {
    expect(services).toHaveProperty('USERS_SERVICE');
    expect(typeof services.USERS_SERVICE).toBe('string');
    expect(services.USERS_SERVICE.length).toBeGreaterThan(0);

    expect(services).toHaveProperty('PROJECTS_SERVICE');
    expect(typeof services.PROJECTS_SERVICE).toBe('string');
    expect(services.PROJECTS_SERVICE.length).toBeGreaterThan(0);

    expect(services).toHaveProperty('MONITORING_SERVICE');
    expect(typeof services.MONITORING_SERVICE).toBe('string');
    expect(services.MONITORING_SERVICE.length).toBeGreaterThan(0);

    expect(services).toHaveProperty('PREDICTIVE_SERVICE');
    expect(typeof services.PREDICTIVE_SERVICE).toBe('string');
    expect(services.PREDICTIVE_SERVICE.length).toBeGreaterThan(0);

    expect(services).toHaveProperty('DOCUMENTS_SERVICE');
    expect(typeof services.DOCUMENTS_SERVICE).toBe('string');
    expect(services.DOCUMENTS_SERVICE.length).toBeGreaterThan(0);
  });

  // Test para verificar que las URLs de los servicios contienen 'http' o 'https'
  test('service URLs should be valid HTTP/HTTPS URLs', () => {
    expect(services.USERS_SERVICE).toContain('http');
    expect(services.PROJECTS_SERVICE).toContain('http');
    expect(services.MONITORING_SERVICE).toContain('http');
    expect(services.PREDICTIVE_SERVICE).toContain('http');
    expect(services.DOCUMENTS_SERVICE).toContain('http');
  });

  // Puedes añadir más tests unitarios para middlewares o funciones auxiliares aquí
  // Por ejemplo, si tuvieras una función para validar JWTs o para formatear respuestas.
});
