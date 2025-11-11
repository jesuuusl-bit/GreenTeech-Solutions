const express = require('express');
const Document = require('../models/Document');
const router = express.Router();

// GET /api/documents - Obtener todos los documentos
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('uploadedBy', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos',
      error: error.message
    });
  }
});

// POST /api/documents - Crear nuevo documento
router.post('/', async (req, res) => {
  try {
    const document = new Document(req.body);
    await document.save();
    
    res.status(201).json({
      success: true,
      data: document,
      message: 'Documento creado exitosamente'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear documento',
      error: error.message
    });
  }
});

// GET /api/documents/test - Endpoint de prueba para activar MongoDB
router.get('/test', async (req, res) => {
  try {
    const count = await Document.countDocuments();
    res.json({
      success: true,
      message: 'Conexión a MongoDB activa',
      documentsCount: count
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