import { Router } from 'express';
import { SyncController } from '../controllers/syncController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de sincronización requieren autenticación
router.use(verificarToken);

// Descarga datos maestros iniciales/incrementales para Dexie.js (IndexedDB)
router.get('/pull', SyncController.pull);

// Subida de lote de transacciones generadas offline (ventas, clientes)
router.post('/push', SyncController.push);

export default router;
