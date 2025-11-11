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
    service: 'documents-service',
    message: 'Servicio de gestión documental funcionando',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'documents-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Basic document endpoints (placeholder)
app.get('/api/documents', (req, res) => {
  res.json({
    success: true,
    message: 'Gestión documental disponible',
    data: {
      documents: [],
      total: 0,
      message: 'Servicio listo para gestión de documentos',
      timestamp: new Date().toISOString()
    }
  });
});

app.post('/api/documents/upload', (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de subida de documentos listo',
    data: {
      message: 'Servicio listo para recibir archivos',
      maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
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

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`📄 Documents Service funcionando en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});