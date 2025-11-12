const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const upload = require('../middleware/upload'); // Importar el middleware de Multer

// GET /api/documents - Obtener todos los documentos
router.get('/', documentController.getAllDocuments);

// POST /api/documents - Crear nuevo documento (usado para datos no de archivo)
router.post('/', documentController.createDocument);

// POST /api/documents/upload - Subir un documento con Multer
router.post('/upload', upload.single('document'), documentController.uploadDocument);

// GET /api/documents/test - Endpoint de prueba para activar MongoDB
router.get('/test', documentController.testMongoDB);

module.exports = router;