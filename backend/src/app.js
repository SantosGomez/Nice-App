import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import empresariaRoutes from './routes/empresariaRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import inventarioRoutes from './routes/inventarioRoutes.js';
import ventaRoutes from './routes/ventaRoutes.js';
import syncRoutes from './routes/syncRoutes.js';

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middlewares globales
app.use(cors()); // Habilita CORS para peticiones desde la app Quasar / tablets
app.use(express.json()); // Parsea cuerpos JSON
app.use(express.urlencoded({ extended: true })); // Parsea cuerpos URL-encoded

// Middleware para registro de peticiones en consola durante desarrollo
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Endpoint de verificación de salud de la API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    app: 'Joyería Nice POS API',
    timestamp: new Date().toISOString()
  });
});

// Montar rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/empresarias', empresariaRoutes);
app.use('/api/usuarios', empresariaRoutes); // Alias para gestión de usuarios
app.use('/api/clientes', clienteRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/sync', syncRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Middleware global de manejo de errores (500)
app.use((err, req, res, next) => {
  console.error('💥 [Error no controlado]:', err);
  res.status(500).json({
    success: false,
    message: 'Ocurrió un error interno en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
