// ===== backend/users-service/src/server.js =====
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const userRoutes = require('./routes/userRoutes');

require('dotenv').config();

const app = express();

// Conectar a base de datos
connectDB();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5000',
      'https://green-teech-solutions.vercel.app',
      /https:\/\/green-teech-solutions.*\.vercel\.app$/,
      /https:\/\/greentech-api-gateway.*\.onrender\.com$/
    ];
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') return origin === allowedOrigin;
      if (allowedOrigin instanceof RegExp) return allowedOrigin.test(origin);
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir temporalmente todos los orígenes
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    service: 'users-service',
    status: 'healthy' 
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Users Service corriendo en puerto ${PORT}`);
});