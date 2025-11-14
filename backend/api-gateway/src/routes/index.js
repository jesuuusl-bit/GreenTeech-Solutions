// ===== backend/api-gateway/src/routes/index.js =====
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware'); // Import createProxyMiddleware
const { authenticate, restrictTo } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const services = require('../config/services');
// Removed FormData and upload imports as they are no longer needed for documents proxy

// Función helper para proxy de requests (para rutas no-documentos)
const proxyRequest = async (req, res, serviceUrl) => {
  try {
    const targetPath = req.originalUrl.replace('/api', '');
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
      timeout: 30000, // 30 segundos
      validateStatus: () => true // Aceptar cualquier status code
    };

    const headersToForward = {};
    for (const key in req.headers) {
      // Exclude content-length and transfer-encoding from being forwarded
      if (key.toLowerCase() !== 'content-length' && key.toLowerCase() !== 'transfer-encoding' && Object.prototype.hasOwnProperty.call(req.headers, key)) {
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

    if (req.body && Object.keys(req.body).length > 0) {
      config.data = req.body;
    }
    
    const response = await axios(config);
    
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
router.get('/users/health', createProxyMiddleware({
  target: services.USERS_SERVICE,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users/health': '/health',
  },
}));

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
const documentsProxy = createProxyMiddleware({
  target: services.DOCUMENTS_SERVICE,
  changeOrigin: true,
  pathRewrite: {
    '^/': '/documents/', // reescribe la raíz a /documents/
  },
  onProxyReq: (proxyReq, req, res) => {
    // Añadir headers de usuario si están disponibles
    if (req.user) {
      proxyReq.setHeader('x-user-id', req.user.id);
      proxyReq.setHeader('x-user-role', req.user.role);
    }
    // Para multipart/form-data, http-proxy-middleware maneja el stream automáticamente
    // No necesitamos hacer nada especial aquí, solo asegurarnos de que el Content-Type original se mantenga
    // y que el body no haya sido consumido por otros middlewares antes de este proxy.
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy error for documents service:', err);
    res.status(500).json({
      success: false,
      message: 'Error al comunicarse con el servicio de documentos',
      error: err.message
    });
  }
});

router.use('/documents', authenticate, documentsProxy); // Aplicar autenticación y luego el proxy

module.exports = router;