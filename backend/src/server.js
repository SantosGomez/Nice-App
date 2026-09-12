import app from './app.js';
import { testConnection } from './config/db.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log('🚀 Iniciando servidor backend Joyería Nice POS...');

  // Verificar conexión a la base de datos antes de escuchar peticiones
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.warn('⚠️  [Aviso] El servidor iniciará, pero MySQL no respondió. Revisa tus credenciales en .env o si MySQL/MariaDB está corriendo.');
  }

  const server = app.listen(PORT, () => {
    console.log(`✨ [Servidor Activo] Escuchando en: http://localhost:${PORT}`);
    console.log(`📦 [Módulos y Rutas disponibles]:`);
    console.log(`   - 🏥 Salud:         GET    http://localhost:${PORT}/api/health`);
    console.log(`   - 💎 Productos:     CRUD   http://localhost:${PORT}/api/productos`);
    console.log(`   - 👩‍💼 Empresarias:   CRUD   http://localhost:${PORT}/api/empresarias`);
    console.log(`   - 👥 Clientes:      CRUD   http://localhost:${PORT}/api/clientes`);
    console.log(`   - 📦 Inventario:    GET    http://localhost:${PORT}/api/inventario/stock/:empresariaId`);
    console.log(`                       POST   http://localhost:${PORT}/api/inventario/movimiento`);
    console.log(`                       GET    http://localhost:${PORT}/api/inventario/movimientos/:empresariaId`);
    console.log(`   - 🛒 Ventas POS:    POST   http://localhost:${PORT}/api/ventas`);
    console.log(`                       GET    http://localhost:${PORT}/api/ventas`);
    console.log(`                       POST   http://localhost:${PORT}/api/ventas/:id/pagos`);
    console.log(`   - 🔄 Offline Sync:  GET    http://localhost:${PORT}/api/sync/pull`);
    console.log(`                       POST   http://localhost:${PORT}/api/sync/push`);
  });

  // Manejo de apagado controlado (Graceful Shutdown)
  const shutdown = () => {
    console.log('\n🛑 Cerrando servidor de forma segura...');
    server.close(() => {
      console.log('💤 Servidor cerrado.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
