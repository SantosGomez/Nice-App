import app from './app.js';
import { testConnection } from './config/db.js';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // 👈 Necesario para que Railway exponga la API a internet

async function startServer() {
  console.log('🚀 Iniciando servidor backend Joyería Nice POS...');

  // Verificar conexión a la base de datos antes de escuchar peticiones
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.warn('⚠️  [Aviso] El servidor iniciará, pero MySQL no respondió. Revisa tus credenciales en .env o si MySQL/MariaDB está corriendo.');
  }

  // 👈 Se agrega HOST ('0.0.0.0') en el llamado de listen
  const server = app.listen(PORT, HOST, () => {
    console.log(`✨ [Servidor Activo] Escuchando en el puerto ${PORT}`);
    console.log(`📦 [Módulos y Rutas disponibles]:`);
    console.log(`   - 🏥 Salud:         GET    /api/health`);
    console.log(`   - 💎 Productos:     CRUD   /api/productos`);
    console.log(`   - 👩‍💼 Empresarias:   CRUD   /api/empresarias`);
    console.log(`   - 👥 Clientes:      CRUD   /api/clientes`);
    console.log(`   - 📦 Inventario:    GET    /api/inventario/stock/:empresariaId`);
    console.log(`                       POST   /api/inventario/movimiento`);
    console.log(`                       GET    /api/inventario/movimientos/:empresariaId`);
    console.log(`   - 🛒 Ventas POS:    POST   /api/ventas`);
    console.log(`                       GET    /api/ventas`);
    console.log(`                       POST   /api/ventas/:id/pagos`);
    console.log(`   - 🔄 Offline Sync:  GET    /api/sync/pull`);
    console.log(`                       POST   /api/sync/push`);
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