import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio de uploads (backend/uploads)
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const cleanName = `joya_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`;
    cb(null, cleanName);
  }
});

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

      const relativeUrl = `/uploads/${req.file.filename}`;
      const protocol = req.protocol;
      const host = req.get('host');
      const fullUrl = `${protocol}://${host}${relativeUrl}`;

      return res.status(200).json({
        success: true,
        message: 'Imagen subida exitosamente',
        data: {
          filename: req.file.filename,
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

      // Extraer tipo MIME y datos en base64
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer = null;
      let ext = '.jpg';

      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        if (mimeType.includes('png')) ext = '.png';
        else if (mimeType.includes('webp')) ext = '.webp';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        // Asumir base64 puro
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
        message: 'Imagen Base64 procesada y guardada exitosamente',
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
