const express = require('express');
const predictiveController = require('../controllers/predictiveController');
const router = express.Router();

// POST /api/predictive/predict - Obtener una predicción
router.post('/predict', predictiveController.getPrediction);

// GET /api/predictive/history - Obtener datos históricos
router.get('/history', predictiveController.getHistoricalData);

// GET /api/predictive/models - Obtener modelos predictivos disponibles
router.get('/models', predictiveController.getPredictionModels);

// GET /api/predictive/test - Endpoint de prueba para activar MongoDB
router.get('/test', async (req, res) => {
  try {
    const count = await Prediction.countDocuments();
    res.json({
      success: true,
      message: 'Conexión a MongoDB activa',
      predictionsCount: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error de conexión a MongoDB',
      error: error.message
    });
  }
});

module.exports = router;