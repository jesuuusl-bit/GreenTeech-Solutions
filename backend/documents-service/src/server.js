const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Conectar a base de datos
connectDB();

// Importar rutas
const documentRoutes = require('./routes/documentRoutes');

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/documents', documentRoutes);

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