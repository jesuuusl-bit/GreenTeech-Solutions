const multer = require('multer');

// Configuración de almacenamiento en memoria para desarrollo
// En producción, se usaría un servicio de almacenamiento en la nube como AWS S3, Google Cloud Storage, etc.
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Aceptar solo ciertos tipos de archivos
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes y PDFs.'), false);
    }
  }
});

module.exports = upload;