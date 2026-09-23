import { Router } from 'express';
import { ProductoController } from '../controllers/productoController.js';
import { verificarToken, soloAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de productos requieren autenticación
router.use(verificarToken);

// Listar productos (con soporte de ?empresariaId=X, ?search=Y, ?categoria=Z)
router.get('/', ProductoController.getProductos);

// Búsqueda rápida por SKU o Código QR para el escáner del Punto de Venta (POS)
router.get('/find/:code', ProductoController.findByCode);

// Obtener producto por ID
router.get('/:id', ProductoController.getProductoById);

// Crear nuevo producto
router.post('/', ProductoController.createProducto);

// Actualizar producto existente
router.put('/:id', ProductoController.updateProducto);

// Eliminar producto (restringido a administradores)
router.delete('/:id', soloAdmin, ProductoController.deleteProducto);

export default router;
