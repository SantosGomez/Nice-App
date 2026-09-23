import { Router } from 'express';
import { VentaController } from '../controllers/ventaController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de ventas requieren autenticación
router.use(verificarToken);

// Registrar una nueva venta completa (transacción con partidas, pagos y stock)
router.post('/', VentaController.crearVenta);

// Listar ventas con filtros (empresaria, cliente, fecha, estado)
router.get('/', VentaController.getVentas);

// Obtener detalle de una venta por ID
router.get('/:id', VentaController.getVentaById);

// Registrar abono o pago posterior a una venta (ej. sistema de apartado)
router.post('/:id/pagos', VentaController.agregarPago);

export default router;
