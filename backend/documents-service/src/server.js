const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const mongoose = require('mongoose'); // Import mongoose

// Load environment variables
if (!process.env.MONGO_URI) { // Load if MONGO_URI is not already defined
  require('dotenv').config();
}

const app = express();
let gfs; // Declare gfs here

const initializeGridFS = async () => {
  try {
    const conn = await connectDB(); // Await the connection
    if (conn) {
      gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });
      console.log('✅ GridFS inicializado');
    }
    return gfs; // Return gfs instance
  } catch (err) {
    console.error('❌ Error al inicializar GridFS:', err.message);
    // Decide whether to exit or just log the error
    throw err; // Re-throw error for tests to catch
  }
};

// Function to configure and start the server (excluding listen)
const configureApp = () => {
  // Importar rutas (after gfs is initialized)
  const documentRoutes = require('./routes/documentRoutes');
  const { reconstructUser } = require('./middleware/auth');

  // Middlewares
  app.use(helmet());
  app.use(cors());
  app.use(morgan('combined'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(reconstructUser);

  // API Routes
  app.use('/documents', documentRoutes);

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
};

// Only configure and listen if not imported as a module (e.g., by tests) and not in test environment
if (require.main === module && process.env.NODE_ENV !== 'test') {
  initializeGridFS().then(() => {
    configureApp();
    const PORT = process.env.PORT || 5005;
    app.listen(PORT, () => {
      console.log(`📄 Documents Service funcionando en puerto ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;
module.exports.getGfs = () => gfs; // Export gfs as a function
module.exports.initializeGridFS = initializeGridFS; // Export initializeGridFS
module.exports.configureApp = configureApp; // Export configureApp