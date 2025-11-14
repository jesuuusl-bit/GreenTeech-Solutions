const express = require('express');
const router = express.Router();
const {
  getAllDocuments,
  getDocumentsByProjectId,
  createDocument,
  uploadDocument,
  downloadDocument, // Import the new downloadDocument function
  testMongoDB
} = require('../controllers/documentController');
const multer = require('multer'); // Import multer
const upload = multer({ storage: multer.memoryStorage() }); // Initialize multer

// GET /api/documents - Obtener todos los documentos
router.get('/', getAllDocuments);

// GET /api/documents/project/:projectId - Obtener documentos por ID de proyecto
router.get('/project/:projectId', getDocumentsByProjectId);

// POST /api/documents - Crear nuevo documento (usado para datos no de archivo)
router.post('/', createDocument);

// POST /api/documents/upload - Subir un documento con Multer
router.post('/upload', upload.single('document'), uploadDocument);

// GET /api/documents/:id/download - Descargar un documento
router.get('/:id/download', downloadDocument);

// GET /api/documents/test - Endpoint de prueba para activar MongoDB
router.get('/test', testMongoDB);

module.exports = router;
