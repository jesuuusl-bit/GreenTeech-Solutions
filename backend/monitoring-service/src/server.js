// ===== backend/monitoring-service/src/server.js =====
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const monitoringRoutes = require('./routes/monitoringRoutes');

require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado - Monitoring Service'))
  .catch(err => {
    console.error('❌ Error de conexión MongoDB:', err.message);
    process.exit(1);
  });

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/monitoring', monitoringRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    service: 'monitoring-service',
    status: 'healthy' 
  });
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Monitoring Service corriendo en puerto ${PORT}`);
});