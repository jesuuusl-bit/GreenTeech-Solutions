const jwt = require('jsonwebtoken');

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

    // Verificar token y decodificar el payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // El ID y el rol del usuario están en el token. Los adjuntamos a la request.
    // Esto es seguro porque hemos verificado la firma del token.
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();

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
    // La comprobación de roles ahora funciona porque el rol está en el token.
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }
    next();
  };
};