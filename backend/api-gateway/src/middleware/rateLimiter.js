// ===== backend/api-gateway/src/middleware/rateLimiter.js =====
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // límite aumentado a 1000 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes, por favor intenta más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.includes('/health');
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // aumentado de 5 a 20 intentos de login en 15 minutos
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.'
  },
  skipSuccessfulRequests: true
});

module.exports = { limiter, authLimiter };