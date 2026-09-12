import { Router } from 'express';
import { ClienteController } from '../controllers/clienteController.js';

const router = Router();

// Listar clientes (soporta ?search=...)
router.get('/', ClienteController.getClientes);

// Obtener cliente por ID
router.get('/:id', ClienteController.getClienteById);

// Registrar nuevo cliente
router.post('/', ClienteController.createCliente);

// Actualizar datos del cliente
router.put('/:id', ClienteController.updateCliente);

// Eliminar cliente
router.delete('/:id', ClienteController.deleteCliente);

export default router;
