// ===== backend/api-gateway/src/routes/index.js =====
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { authenticate, restrictTo } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const services = require('../config/services');

// Función helper para proxy de requests
const proxyRequest = async (req, res, serviceUrl) => {
  try {
    // Construir la URL completa
    const targetPath = req.originalUrl.replace('/api', '');
    const fullUrl = `${serviceUrl}${targetPath}`;
    
    console.log(`📡 Proxy request: ${req.method} ${fullUrl}`);
    
    const config = {
      method: req.method,
      url: fullUrl,
      headers: {
        ...req.headers,
        host: new URL(serviceUrl).host,
        'x-forwarded-host': req.headers.host,
        'x-forwarded-proto': req.protocol,
        'x-forwarded-for': req.ip
      },
      timeout: 30000, // 30 segundos
      validateStatus: () => true // Aceptar cualquier status code
    };

    // Añadir body si existe
    if (req.body && Object.keys(req.body).length > 0) {
      config.data = req.body;
    }
    
    // Añadir query params si existen
    if (req.query && Object.keys(req.query).length > 0) {
      config.params = req.query;
    }

    const response = await axios(config);
    
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
router.post('/users/login', authLimiter, (req, res) => 
  proxyRequest(req, res, `${services.USERS_SERVICE}/login`)
);

router.post('/users/register', authenticate, restrictTo('admin'), (req, res) => 
  proxyRequest(req, res, services.USERS_SERVICE)
);

// ========== RUTAS DE USUARIOS ==========
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
router.use('/documents', authenticate, (req, res) => 
  proxyRequest(req, res, services.DOCUMENTS_SERVICE)
);

module.exports = router;