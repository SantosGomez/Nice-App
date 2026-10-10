import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { uploadImageToCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio de uploads local de respaldo (fallback si Cloudinary no estuviera configurado)
const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '../../uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('Directorio de uploads no modificable en este entorno:', err.message);
}

// Usamos memoryStorage en Multer para compatibilidad total con Serverless
const storage = multer.memoryStorage();

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowedTypes.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, WEBP, GIF)'));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
  fileFilter
});

export const UploadController = {
  /**
   * POST /api/upload
   * Maneja subida de archivo por FormData (multipart/form-data)
   */
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se recibió ningún archivo de imagen'
        });
      }

      // 1. Si Cloudinary está configurado, subir directamente a la nube
      if (isCloudinaryConfigured()) {
        const secureUrl = await uploadImageToCloudinary(req.file.buffer);
        return res.status(200).json({
          success: true,
          message: 'Imagen subida exitosamente a Cloudinary',
          data: {
            filename: req.file.originalname,
            url: secureUrl,
            fullUrl: secureUrl,
            size: req.file.size
          }
        });
      }

      // 2. Fallback a almacenamiento en disco local
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const cleanName = `joya_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`;
      const filePath = path.join(uploadsDir, cleanName);

      await fs.promises.writeFile(filePath, req.file.buffer);

      const relativeUrl = `/uploads/${cleanName}`;
      const protocol = req.protocol;
      const host = req.get('host');
      const fullUrl = `${protocol}://${host}${relativeUrl}`;

      return res.status(200).json({
        success: true,
        message: 'Imagen subida exitosamente a disco local',
        data: {
          filename: cleanName,
          url: relativeUrl,
          fullUrl,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('Error en uploadFile:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al procesar la imagen',
        error: error.message
      });
    }
  },

  /**
   * POST /api/upload/base64
   * Maneja subida directa de imágenes en Base64 (canvas o capturas de cámara)
   */
  async uploadBase64(req, res) {
    try {
      const { image, filename } = req.body;

      if (!image || typeof image !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Debes proporcionar una cadena Base64 válida en el campo "image"'
        });
      }

      // 1. Si Cloudinary está configurado, subir directamente a la nube
      if (isCloudinaryConfigured()) {
        const secureUrl = await uploadImageToCloudinary(image);
        return res.status(200).json({
          success: true,
          message: 'Imagen Base64 procesada y subida a Cloudinary exitosamente',
          data: {
            filename: filename || 'joya_cloudinary.jpg',
            url: secureUrl,
            fullUrl: secureUrl,
            size: image.length
          }
        });
      }

      // 2. Fallback a almacenamiento local
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer = null;
      let ext = '.jpg';

      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        if (mimeType.includes('png')) ext = '.png';
        else if (mimeType.includes('webp')) ext = '.webp';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(image, 'base64');
      }

      const cleanFilename = filename ? `${path.parse(filename).name}_${Date.now()}${ext}` : `joya_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`;
      const filePath = path.join(uploadsDir, cleanFilename);

      await fs.promises.writeFile(filePath, buffer);

      const relativeUrl = `/uploads/${cleanFilename}`;
      const protocol = req.protocol;
      const host = req.get('host');
      const fullUrl = `${protocol}://${host}${relativeUrl}`;

      return res.status(200).json({
        success: true,
        message: 'Imagen Base64 procesada y guardada localmente',
        data: {
          filename: cleanFilename,
          url: relativeUrl,
          fullUrl,
          size: buffer.length
        }
      });
    } catch (error) {
      console.error('Error en uploadBase64:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al guardar la imagen Base64',
        error: error.message
      });
    }
  }
};

export default UploadController;
