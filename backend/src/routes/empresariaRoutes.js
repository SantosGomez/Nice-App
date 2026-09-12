import { Router } from 'express';
import { EmpresariaController } from '../controllers/empresariaController.js';

const router = Router();

// Catálogo de roles
router.get('/roles', EmpresariaController.getRoles);

// Rutas de Empresarias / Distribuidoras Nice
// Listar empresarias (con soporte de filtros ?estado=Activa&rolId=...&search=...)
router.get('/', EmpresariaController.getEmpresarias);

// Obtener empresaria por ID
router.get('/:id', EmpresariaController.getEmpresariaById);

// Registrar nueva empresaria desde el panel
router.post('/', EmpresariaController.createEmpresaria);

// Actualizar datos de empresaria (incluyendo contraseña)
router.put('/:id', EmpresariaController.updateEmpresaria);

// Eliminar empresaria
router.delete('/:id', EmpresariaController.deleteEmpresaria);

export default router;
