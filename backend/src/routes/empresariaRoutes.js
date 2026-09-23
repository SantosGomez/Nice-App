import { Router } from 'express';
import { EmpresariaController } from '../controllers/empresariaController.js';
import { verificarToken, soloAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de usuarios/empresarias requieren autenticación
router.use(verificarToken);

// Catálogo de roles
router.get('/roles', EmpresariaController.getRoles);

// Rutas de Empresarias / Distribuidoras Nice
// Listar empresarias (restringido a administradores)
router.get('/', soloAdmin, EmpresariaController.getEmpresarias);

// Obtener empresaria por ID
router.get('/:id', EmpresariaController.getEmpresariaById);

// Registrar nueva empresaria desde el panel administrativo
router.post('/', soloAdmin, EmpresariaController.createEmpresaria);

// Actualizar datos de empresaria (incluyendo contraseña)
router.put('/:id', EmpresariaController.updateEmpresaria);

// Eliminar empresaria (restringido a administradores)
router.delete('/:id', soloAdmin, EmpresariaController.deleteEmpresaria);

export default router;
