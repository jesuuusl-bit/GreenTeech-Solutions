// ===== backend/api-gateway/src/routes/index.js =====
const express = require('express');
const axios = require('axios');
const router = express.Router();
const FormData = require('form-data'); // Import form-data
const { authenticate, restrictTo } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const services = require('../config/services');
const upload = require('../middleware/upload'); // Import API Gateway's multer middleware

// Función helper para proxy de requests
const proxyRequest = async (req, res, serviceUrl) => {
  try {
    // Construir la URL completa
    const targetPath = req.originalUrl.replace('/api', '');
    const fullUrl = `${serviceUrl}${targetPath}`;
    
    console.log(`📡 Proxy request: ${req.method} ${fullUrl}`);
    console.log(`🔍 Incoming Content-Type: ${req.headers['content-type']}`);
    
    const config = {
      method: req.method,
      url: fullUrl,
      headers: {
        ...req.headers,
        host: new URL(serviceUrl).host,
        'x-forwarded-host': req.headers.host,
        'x-forwarded-proto': req.protocol,
        'x-forwarded-for': req.ip,
        // Forward user info from API Gateway to microservice
        ...(req.user && { 'x-user-id': req.user.id, 'x-user-role': req.user.role })
      },
      timeout: 30000, // 30 segundos
      validateStatus: () => true // Aceptar cualquier status code
    };

    // Añadir body si existe
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      // Si es multipart/form-data, reconstruir el FormData
      if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
        const form = new FormData();
        // Añadir el archivo
        if (req.file) {
          form.append(req.file.fieldname, req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
          });
        }
        // Añadir otros campos del body
        for (const key in req.body) {
          form.append(key, req.body[key]);
        }
        config.data = form; // Pass the form object directly, axios will handle the stream
        // Merge headers from form-data, which includes the correct Content-Type with boundary
        config.headers = { ...config.headers, ...form.getHeaders() };
        console.log(`📦 Proxying multipart/form-data: Reconstructed FormData with correct headers.`);
      } else if (req.body && Object.keys(req.body).length > 0) {
        config.data = req.body;
        console.log(`📦 Proxying JSON/URL-encoded data: config.data set to req.body.`);
      } else {
        console.log(`📦 No body to proxy or body is empty.`);
      }
    }
    
    

    const response = await axios(config);
    console.log(`✅ Proxy response status: ${response.status}`);
    console.log(`✅ Proxy response data (first 100 chars): ${JSON.stringify(response.data).substring(0, 100)}`);
    
    // Reenviar todos los headers de respuesta
    Object.keys(response.headers).forEach(key => {
      res.setHeader(key, response.headers[key]);
    });
    
    res.status(response.status).json(response.data);
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
router.get('/users/health', (req, res) => {
  proxyRequest(req, res, services.USERS_SERVICE + '/health');
});

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
// Specific route for document upload to apply multer middleware
router.post('/documents/upload', authenticate, upload.single('document'), (req, res) => {
  proxyRequest(req, res, services.DOCUMENTS_SERVICE);
});

router.use('/documents', authenticate, (req, res) => 
  proxyRequest(req, res, services.DOCUMENTS_SERVICE)
);

module.exports = router;