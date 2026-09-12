import { Router } from 'express';
import { SyncController } from '../controllers/syncController.js';

const router = Router();

// Descarga datos maestros iniciales/incrementales para Dexie.js (IndexedDB)
router.get('/pull', SyncController.pull);

// Subida de lote de transacciones generadas offline (ventas, clientes)
router.post('/push', SyncController.push);

export default router;
