const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

require('dotenv').config();

const app = express();

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado - Projects Service'))
  .catch(err => {
    console.error('❌ Error de conexión MongoDB:', err.message);
    process.exit(1);
  });

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rutas
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    service: 'projects-service',
    status: 'healthy' 
  });
});

const PORT = process.env.PORT || 5002;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Projects Service corriendo en puerto ${PORT}`);
  });
}

module.exports = app;