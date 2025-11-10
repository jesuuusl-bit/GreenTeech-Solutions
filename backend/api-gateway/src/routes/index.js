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
    const config = {
      method: req.method,
      url: `${serviceUrl}${req.originalUrl.replace('/api', '/api')}`,
      headers: {
        ...req.headers,
        host: new URL(serviceUrl).host
      },
      ...(req.body && Object.keys(req.body).length > 0 && { data: req.body }),
      ...(req.query && Object.keys(req.query).length > 0 && { params: req.query })
    };

    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al comunicarse con el servicio',
        error: error.message
      });
    }
  }
};

// ========== RUTAS DE AUTENTICACIÓN ==========
router.post('/users/login', authLimiter, (req, res) => 
  proxyRequest(req, res, services.USERS_SERVICE)
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