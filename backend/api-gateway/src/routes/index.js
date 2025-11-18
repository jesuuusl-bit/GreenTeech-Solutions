// ===== backend/api-gateway/src/routes/index.js =====
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { authenticate, restrictTo } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const services = require('../config/services');
const FormData = require('form-data'); // Import form-data
const multer = require('multer'); // Import multer
const upload = multer({ storage: multer.memoryStorage() }); // Initialize multer

// Función helper para proxy de requests (para rutas no-documentos)
const proxyRequest = async (req, res, serviceUrl, customPath = null, file = null, body = {}) => {
  try {
    const targetPath = customPath || req.originalUrl.replace('/api', '');
    const fullUrl = `${serviceUrl}${targetPath}`;
    
    console.log(`📡 Proxy request: ${req.method} ${fullUrl}`);
    
    const config = {
      method: req.method,
      url: fullUrl,
      headers: {
        host: new URL(serviceUrl).host,
        'x-forwarded-host': req.headers.host,
        'x-forwarded-proto': req.protocol,
        'x-forwarded-for': req.ip,
        // Forward user info from API Gateway to microservice
        ...(req.user && { 'x-user-id': req.user.id, 'x-user-role': req.user.role })
      },
      timeout: 120000, // 120 segundos
      validateStatus: () => true // Aceptar cualquier status code
    };

    const headersToForward = {};
    for (const key in req.headers) {
      // Exclude content-length and transfer-encoding from being forwarded
      // Also exclude content-type if it's multipart/form-data, as form-data will set it
      if (key.toLowerCase() !== 'content-length' && key.toLowerCase() !== 'transfer-encoding' && 
          (key.toLowerCase() !== 'content-type' || !file) && // Use 'file' argument here
          Object.prototype.hasOwnProperty.call(req.headers, key)) {
        headersToForward[key] = req.headers[key];
      }
    }

    config.headers = {
      ...headersToForward, // Use the explicitly filtered headers
      host: new URL(serviceUrl).host,
      'x-forwarded-host': req.headers.host,
      'x-forwarded-proto': req.protocol,
      'x-forwarded-for': req.ip,
      // Forward user info from API Gateway to microservice
      ...(req.user && { 'x-user-id': req.user.id, 'x-user-role': req.user.role })
    };

    // Handle multipart/form-data
    if (file) { // Check if file is explicitly passed
      const formData = new FormData(); // Renamed to formData to avoid conflict with global FormData

      // Append fields
      for (const key in body) { // Use passed body
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          formData.append(key, body[key]);
        }
      }

      // Append file
      formData.append(file.fieldname, file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      config.data = formData;
      config.headers = { ...config.headers, ...formData.getHeaders() };
    } else if (body && Object.keys(body).length > 0) { // Use passed body
      config.data = body;
    } else if (req.body && Object.keys(req.body).length > 0) { // Fallback to req.body if no explicit body
      config.data = req.body;
    }
    
    const response = await axios(config);
    
    // Forward all headers from the proxied response
    Object.keys(response.headers).forEach(key => {
      res.setHeader(key, response.headers[key]);
    });

    // Check if the response is a file download
    const contentType = response.headers['content-type'];
    if (contentType && (contentType.includes('application/') || contentType.includes('image/') || contentType.includes('text/plain'))) {
      // For file downloads, stream the data directly
      res.status(response.status);
      response.data.pipe(res); // Assuming response.data is a stream for file downloads
    } else {
      // For other responses, send as JSON
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error(`❌ Proxy error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Servicio no disponible temporalmente',
        error: 'El microservicio no está respondiendo'
      });
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'Timeout al conectar con el servicio',
        error: 'El servicio tardó demasiado en responder'
      });
    }
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al comunicarse con el servicio',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }
};

// ========== RUTAS DE AUTENTICACIÓN ==========
// Fixed login route for production deployment
router.post('/users/login', authLimiter, (req, res) => 
  proxyRequest(req, res, services.USERS_SERVICE)
);

router.post('/users/register', authenticate, restrictTo('admin'), (req, res) => 
  proxyRequest(req, res, services.USERS_SERVICE)
);

// ========== RUTAS DE USUARIOS ==========
// Specific health check for users service
router.get('/users/health', (req, res) => 
  proxyRequest(req, res, services.USERS_SERVICE, '/health')
);

router.use('/users', authenticate, (req, res) => 
  proxyRequest(req, res, services.USERS_SERVICE)
);

// ========== RUTAS DE PROYECTOS ==========
router.use('/projects', authenticate, (req, res) => 
  proxyRequest(req, res, services.PROJECTS_SERVICE)
);

router.use('/tasks', authenticate, (req, res) => 
  proxyRequest(req, res, services.PROJECTS_SERVICE)
);

// ========== RUTAS DE MONITOREO ==========
router.use('/monitoring', authenticate, (req, res) => 
  proxyRequest(req, res, services.MONITORING_SERVICE)
);

router.use('/alerts', authenticate, (req, res) => 
  proxyRequest(req, res, services.MONITORING_SERVICE)
);

// ========== RUTAS PREDICTIVAS ==========
router.use('/predictive', authenticate, (req, res) => 
  proxyRequest(req, res, services.PREDICTIVE_SERVICE)
);

router.use('/simulations', authenticate, (req, res) => 
  proxyRequest(req, res, services.PREDICTIVE_SERVICE)
);

// ========== RUTAS DE DOCUMENTOS ==========
// Specific route for document upload
router.post('/documents/upload', upload.single('document'), authenticate, (req, res) => {
  proxyRequest(req, res, services.DOCUMENTS_SERVICE, req.url, req.file, req.body);
});

// Specific route for document download
router.get('/documents/:id/download', authenticate, (req, res) => {
  // Construct the target URL for the documents-service
  const documentId = req.params.id;
  const customPath = `/documents/${documentId}/download`; // This is the path expected by documents-service
  proxyRequest(req, res, services.DOCUMENTS_SERVICE, customPath, req.file, req.body);
});

// General documents routes (if any, without upload.single)
router.use('/documents', authenticate, (req, res) => 
  proxyRequest(req, res, services.DOCUMENTS_SERVICE, req.url, req.file, req.body)
);

module.exports = router;