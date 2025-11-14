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

const Sentry = require('@sentry/node');

console.log('DEBUG: process.env.SENTRY_DSN:', process.env.SENTRY_DSN);

if (process.env.SENTRY_DSN && process.env.SENTRY_DSN.length > 0) { // Also check for empty string
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
  console.log('DEBUG: Sentry.init() called.');
} else {
  console.warn('SENTRY_DSN no está configurado o está vacío. Sentry no se inicializará.');
}

console.log('DEBUG: Sentry.Handlers after init block:', Sentry.Handlers);

const app = express();

// ⚠️ IMPORTANTE: Configurar trust proxy para Render
app.set('trust proxy', 1);

// Seguridad y middlewares
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (como apps móviles o Postman)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://green-teech-solutions.vercel.app',
      'green-teech-solutions-jesuuusl-bits-projects.vercel.app',
      /https:\/\/green-teech-solutions.*\.vercel\.app$/ // Permite cualquier preview de Vercel
    ];
    
    // Verificar si el origin está en la lista o coincide con el patrón
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS bloqueado para origen: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 horas
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sentry request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

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
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

module.exports = app;