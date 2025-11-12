const multer = require('multer');

// Configuración de almacenamiento en memoria para desarrollo
// En producción, se usaría un servicio de almacenamiento en la nube como AWS S3, Google Cloud Storage, etc.
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    console.log(`[Multer] File received: ${file.originalname}, Mimetype: ${file.mimetype}`);
    // Aceptar solo ciertos tipos de archivos
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      console.log(`[Multer] File ${file.originalname} accepted.`);
      cb(null, true);
    } else {
      console.log(`[Multer] File ${file.originalname} rejected. Mimetype: ${file.mimetype}`);
      cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes y PDFs.'), false);
    }
  }
});

module.exports = upload;