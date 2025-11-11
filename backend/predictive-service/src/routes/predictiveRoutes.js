const express = require('express');
const Prediction = require('../models/Prediction');
const router = express.Router();

// GET /api/predictive - Obtener todas las predicciones
router.get('/', async (req, res) => {
  try {
    const predictions = await Prediction.find()
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener predicciones',
      error: error.message
    });
  }
});

// POST /api/predictive - Crear nueva predicción
router.post('/', async (req, res) => {
  try {
    const prediction = new Prediction(req.body);
    await prediction.save();
    
    res.status(201).json({
      success: true,
      data: prediction,
      message: 'Predicción creada exitosamente'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear predicción',
      error: error.message
    });
  }
});

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