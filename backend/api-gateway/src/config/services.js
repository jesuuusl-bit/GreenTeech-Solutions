module.exports = {
  USERS_SERVICE: process.env.USERS_SERVICE_URL || 'http://localhost:5001',
  PROJECTS_SERVICE: process.env.PROJECTS_SERVICE_URL || 'http://localhost:5002',
  MONITORING_SERVICE: process.env.MONITORING_SERVICE_URL || 'http://localhost:5003',
  PREDICTIVE_SERVICE: process.env.PREDICTIVE_SERVICE_URL || 'http://localhost:5004',
  DOCUMENTS_SERVICE: process.env.DOCUMENTS_SERVICE_URL || 'http://localhost:5005'
};
