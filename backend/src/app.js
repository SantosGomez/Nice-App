import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import empresariaRoutes from './routes/empresariaRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import inventarioRoutes from './routes/inventarioRoutes.js';
import ventaRoutes from './routes/ventaRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

// Definir __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Cabeceras de seguridad HTTP con Helmet (permitiendo recursos cruzados para imágenes)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Configuración de CORS segura
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:9000', 'http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:9000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (apps móviles, scripts internos) o en desarrollo / whitelist
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`CORS bloqueado para el origen: ${origin}`));
    },
    credentials: true
  })
);

// Rate limiter global para proteger la API contra saturación / DoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1200, // hasta 1200 peticiones cada 15 min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Límite de peticiones alcanzado. Por favor intenta de nuevo en unos minutos.'
  }
});
app.use('/api', apiLimiter);

app.use(express.json({ limit: '15mb' })); 
app.use(express.urlencoded({ limit: '15mb', extended: true })); 

// Servir la carpeta pública de imágenes y uploads
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware para registro de peticiones
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    app: 'Joyería Nice POS API',
    timestamp: new Date().toISOString()
  });
});

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/empresarias', empresariaRoutes);
app.use('/api/usuarios', empresariaRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/upload', uploadRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error('💥 [Error no controlado]:', err);
  res.status(500).json({
    success: false,
    message: 'Ocurrió un error interno en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;