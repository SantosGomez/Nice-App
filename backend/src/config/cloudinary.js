import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

/**
 * Verifica si las credenciales de Cloudinary están presentes en el entorno.
 */
export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Sube una imagen (Base64 data URI, Buffer o path) a Cloudinary.
 * @param {string|Buffer} fileData - Cadena Base64 Data URI o Buffer o ruta.
 * @param {string} [folder='nice_joyas'] - Carpeta dentro de Cloudinary.
 * @returns {Promise<string>} URL segura (https) de la imagen subida en Cloudinary.
 */
export async function uploadImageToCloudinary(fileData, folder = 'nice_joyas') {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary no está configurado en las variables de entorno.');
  }

  // Si es un Buffer, subir mediante upload_stream
  if (Buffer.isBuffer(fileData)) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(fileData);
    });
  }

  // Si es string (data:image/... o URL o file path)
  const result = await cloudinary.uploader.upload(fileData, {
    folder,
    resource_type: 'image',
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  });

  return result.secure_url;
}

export default cloudinary;
