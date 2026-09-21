import { Router } from 'express';
import { UploadController, uploadMiddleware } from '../controllers/uploadController.js';

const router = Router();

// Subir archivo por FormData (campo 'image' o 'file')
router.post('/', uploadMiddleware.single('image'), UploadController.uploadFile);

// Subir imagen en Base64
router.post('/base64', UploadController.uploadBase64);

export default router;
