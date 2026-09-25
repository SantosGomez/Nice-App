import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { verificarToken, soloAdmin } from '../middlewares/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Limitador estricto para inicio de sesión (previene ataques de fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // máx 30 intentos en 15 minutos por IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Por seguridad, espera 15 minutos antes de volver a intentar.'
  }
});

// Rutas de autenticación
router.post('/login', authLimiter, AuthController.login);
router.post('/register', AuthController.register);

// Ruta protegida para consultar usuario en sesión
router.get('/me', verificarToken, AuthController.me);

export default router;
