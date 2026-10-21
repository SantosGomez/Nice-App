import { Router } from 'express';
import { ClienteController } from '../controllers/clienteController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de clientes requieren autenticación
router.use(verificarToken);

// Listar clientes (soporta ?search=...)
router.get('/', ClienteController.getClientes);

// Historial general consolidado de clientes
router.get('/historial/general', ClienteController.getHistorialGeneral);

// Historial / Kardex de un cliente específico
router.get('/:id/historial', ClienteController.getHistorialCliente);

// Obtener cliente por ID
router.get('/:id', ClienteController.getClienteById);

// Registrar nuevo cliente
router.post('/', ClienteController.createCliente);

// Actualizar datos del cliente
router.put('/:id', ClienteController.updateCliente);

// Eliminar cliente
router.delete('/:id', ClienteController.deleteCliente);

export default router;
