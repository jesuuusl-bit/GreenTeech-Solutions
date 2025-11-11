const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const monitoringRoutes = require('./routes/monitoringRoutes');

require('dotenv').config();

const app = express();

// Trust proxy para Render
app.set('trust proxy', 1);

// Conectar a base de datos
connectDB();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/monitoring', monitoringRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    service: 'monitoring-service',
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

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Monitoring Service corriendo en puerto ${PORT}`);
});