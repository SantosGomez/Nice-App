import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Middlewares globales
app.use(cors());
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