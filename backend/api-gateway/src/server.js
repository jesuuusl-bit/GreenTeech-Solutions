// ===== backend/api-gateway/src/server.js =====
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const routes = require('./routes');
const { limiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

require('dotenv').config();

const app = express();

//permitir varios dominios en vercel
const allowedOrigins = [
    // 1. Dominio de Producción Fijo
    'https://green-teech-solutions.vercel.app',
    // 2. Dominio de Desarrollo Local
    'http://localhost:3000',
    // 3. (OPCIONAL) Permitir cualquier subdominio de Vercel (menos seguro)
    // O lista todos los dominios de preview que uses:
    'https://green-teech-solutions-ededpvxop-jesuuusl-bits-projects.vercel.app' 
];

// ⚠️ IMPORTANTE: Configurar trust proxy para Render
app.set('trust proxy', 1);

// Seguridad y middlewares
app.use(helmet());

//Ajustar Cors --------------- process.env.FRONTEND_URL || 'https://green-teech-solutions.vercel.app',
app.use(cors({
    // La propiedad 'origin' ahora puede ser un array
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting global
app.use('/api/', limiter);

// Rutas principales
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Ruta no encontrada
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`
  });
});

// Manejo global de errores
app.use(errorHandler);

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