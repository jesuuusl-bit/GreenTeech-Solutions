const multer = require('multer');

// Configuración de almacenamiento en memoria para el API Gateway
// El API Gateway solo necesita parsear el archivo, no almacenarlo permanentemente.
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit, should match documents-service
});

module.exports = upload;
