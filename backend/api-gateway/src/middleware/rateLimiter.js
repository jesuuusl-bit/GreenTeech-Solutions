// ===== backend/api-gateway/src/middleware/rateLimiter.js =====
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes, por favor intenta más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // solo 5 intentos de login en 15 minutos
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación'
  },
  skipSuccessfulRequests: true
});

module.exports = { limiter, authLimiter };