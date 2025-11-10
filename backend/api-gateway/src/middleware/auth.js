// ===== backend/api-gateway/src/middleware/auth.js =====
const jwt = require('jsonwebtoken');
const axios = require('axios');

exports.authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Token no proporcionado'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener información del usuario desde users-service
    try {
      const response = await axios.get(
        `${process.env.USERS_SERVICE_URL}/api/users/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      req.user = response.data.data;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no válido'
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: error.message
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }
    next();
  };
};