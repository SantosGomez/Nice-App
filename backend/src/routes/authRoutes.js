import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas públicas de autenticación
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

// Ruta protegida para consultar usuario en sesión
router.get('/me', verificarToken, AuthController.me);

export default router;
