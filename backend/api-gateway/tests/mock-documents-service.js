const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors()); // Permitir CORS para que el API Gateway pueda comunicarse
app.use(express.json());

// Mock de la ruta de subida de documentos
app.post('/upload', upload.single('document'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided by mock service.' });
  }
  // Simular la lógica del documents-service
  res.status(201).json({
    success: true,
    message: 'Mock document uploaded successfully!',
    data: {
      _id: 'mockDocId',
      title: req.body.title || req.file.originalname,
      type: req.body.type || 'other',
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.originalname}`,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.headers['x-user-id'] || 'mockUserId',
      projectId: req.body.projectId || null,
    },
  });
});

// Mock de otras rutas de documentos (ej. GET /documents)
app.get('/documents', (req, res) => {
  res.status(200).json({
    success: true,
    data: [], // Retorna un array vacío por defecto
    message: 'Mock documents fetched successfully',
  });
});

// Mock de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'documents-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
