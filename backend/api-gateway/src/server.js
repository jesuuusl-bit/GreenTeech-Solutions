const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║   🚀 API GATEWAY - GreenTech Solutions    ║
  ║   Puerto: ${PORT}                           ║
  ║   Ambiente: ${process.env.NODE_ENV || 'development'}           ║
  ╚════════════════════════════════════════════╝
  `);
  console.log('📡 Servicios conectados:');
  console.log('  - Users Service:', process.env.USERS_SERVICE_URL);
  console.log('  - Projects Service:', process.env.PROJECTS_SERVICE_URL);
  console.log('  - Monitoring Service:', process.env.MONITORING_SERVICE_URL);
  console.log('  - Predictive Service:', process.env.PREDICTIVE_SERVICE_URL);
  console.log('  - Documents Service:', process.env.DOCUMENTS_SERVICE_URL);
});
