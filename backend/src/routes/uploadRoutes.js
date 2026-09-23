import { Router } from 'express';
import { UploadController, uploadMiddleware } from '../controllers/uploadController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de subida de archivos requieren autenticación
router.use(verificarToken);

// Subir archivo por FormData (campo 'image' o 'file')
router.post('/', uploadMiddleware.single('image'), UploadController.uploadFile);

// Subir imagen en Base64
router.post('/base64', UploadController.uploadBase64);

export default router;
