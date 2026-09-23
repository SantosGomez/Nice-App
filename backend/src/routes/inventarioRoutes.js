import { Router } from 'express';
import { InventarioController } from '../controllers/inventarioController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de inventario requieren autenticación
router.use(verificarToken);

// Consultar stock actual de una empresaria
router.get('/stock/:empresariaId', InventarioController.getStock);

// Registrar movimiento de inventario (IN_QR, MANUAL_IN, ADJUSTMENT)
router.post('/movimiento', InventarioController.registrarMovimiento);

// Historial de movimientos de una empresaria
router.get('/movimientos/:empresariaId', InventarioController.getMovimientos);

export default router;
