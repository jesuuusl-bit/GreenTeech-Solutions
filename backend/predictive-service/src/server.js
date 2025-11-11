const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'predictive-service',
    message: 'Servicio de análisis predictivo funcionando',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'predictive-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Basic predictive endpoints (placeholder)
app.get('/api/predictive/analysis', (req, res) => {
  res.json({
    success: true,
    message: 'Análisis predictivo disponible',
    data: {
      prediction: 'Servicio listo para implementar algoritmos ML',
      confidence: 0.95,
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/simulations', (req, res) => {
  res.json({
    success: true,
    message: 'Simulaciones disponibles',
    data: {
      simulation: 'Servicio listo para simulaciones de energía',
      status: 'ready',
      timestamp: new Date().toISOString()
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  });
});

const PORT = process.env.PORT || 5004;

app.listen(PORT, () => {
  console.log(`🔮 Predictive Service funcionando en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});