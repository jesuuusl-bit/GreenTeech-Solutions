const express = require('express');
const router = express.Router();
const {
  getAllDocuments,
  getDocumentsByProjectId,
  createDocument,
  uploadDocument,
  testMongoDB
} = require('../controllers/documentController');
const upload = require('../middleware/upload'); // Importar el middleware de Multer

// GET /api/documents - Obtener todos los documentos
router.get('/', getAllDocuments);

// GET /api/documents/project/:projectId - Obtener documentos por ID de proyecto
router.get('/project/:projectId', getDocumentsByProjectId);

// POST /api/documents - Crear nuevo documento (usado para datos no de archivo)
router.post('/', createDocument);

// POST /api/documents/upload - Subir un documento con Multer
router.post('/upload', upload.single('document'), uploadDocument);

// GET /api/documents/test - Endpoint de prueba para activar MongoDB
router.get('/test', testMongoDB);

module.exports = router;
