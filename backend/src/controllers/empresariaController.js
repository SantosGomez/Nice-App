import bcrypt from 'bcryptjs';
import { EmpresariaModel } from '../models/empresariaModel.js';

/**
 * Controlador de Empresarias y Usuarios del sistema Nice POS.
 */
export const EmpresariaController = {
  /**
   * GET /api/empresarias
   * Obtiene la lista de empresarias/usuarios registradas.
   */
  async getEmpresarias(req, res) {
    try {
      const { estado, rolId, search } = req.query;
      const empresarias = await EmpresariaModel.getAll({ estado, rolId, search });

      return res.status(200).json({
        success: true,
        count: empresarias.length,
        data: empresarias
      });
    } catch (error) {
      console.error('Error en getEmpresarias:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de empresarias',
        error: error.message
      });
    }
  },

  /**
   * GET /api/empresarias/roles
   * Obtiene el catálogo de roles disponibles.
   */
  async getRoles(req, res) {
    try {
      const roles = await EmpresariaModel.getRoles();
      return res.status(200).json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Error en getRoles:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener los roles',
        error: error.message
      });
    }
  },

  /**
   * GET /api/empresarias/:id
   * Obtiene una empresaria por su IdEmpresaria.
   */
  async getEmpresariaById(req, res) {
    try {
      const { id } = req.params;
      const empresaria = await EmpresariaModel.getById(id);

      if (!empresaria) {
        return res.status(404).json({
          success: false,
          message: `Empresaria con ID '${id}' no encontrada`
        });
      }

      return res.status(200).json({
        success: true,
        data: empresaria
      });
    } catch (error) {
      console.error('Error en getEmpresariaById:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener la empresaria',
        error: error.message
      });
    }
  },

  /**
   * POST /api/empresarias
   * Registra una nueva empresaria/usuario desde el panel de control.
   */
  async createEmpresaria(req, res) {
    try {
      const { EIN, Password, Nombre, Telefono, PorcentajeDescuento, Estado, RolId } = req.body;

      if (!Nombre || Nombre.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la empresaria es obligatorio'
        });
      }

      if (!EIN || EIN.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El número de empresaria (EIN) es obligatorio'
        });
      }

      const einLimpio = EIN.trim();
      const existente = await EmpresariaModel.findByEIN(einLimpio);
      if (existente) {
        return res.status(409).json({
          success: false,
          message: `El número de empresaria (EIN) '${einLimpio}' ya existe`
        });
      }

      const pass = Password && Password.trim() !== '' ? Password.trim() : '123456';
      const hashedPassword = await bcrypt.hash(pass, 10);

      const descuento = PorcentajeDescuento !== undefined ? Number(PorcentajeDescuento) : 25.0;
      if (isNaN(descuento) || descuento < 0 || descuento > 100) {
        return res.status(400).json({
          success: false,
          message: 'El porcentaje de descuento debe ser un número entre 0 y 100'
        });
      }

      const nuevaEmpresaria = await EmpresariaModel.create({
        EIN: einLimpio,
        Password: hashedPassword,
        Nombre: Nombre.trim(),
        Telefono: Telefono ? Telefono.trim() : null,
        PorcentajeDescuento: descuento,
        Estado: Estado || 'Activa',
        RolId: RolId !== undefined ? Number(RolId) : 3
      });

      const usuarioCreado = await EmpresariaModel.getById(nuevaEmpresaria.IdEmpresaria);

      return res.status(201).json({
        success: true,
        message: 'Empresaria registrada exitosamente',
        data: usuarioCreado
      });
    } catch (error) {
      console.error('Error en createEmpresaria:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al registrar la empresaria',
        error: error.message
      });
    }
  },

  /**
   * PUT /api/empresarias/:id
   * Actualiza los datos de una empresaria / usuario (incluyendo contraseña si se provee).
   */
  async updateEmpresaria(req, res) {
    try {
      const { id } = req.params;
      const { EIN, Password, Nombre, Telefono, PorcentajeDescuento, Estado, RolId } = req.body;

      const updateData = {};

      if (Nombre !== undefined) updateData.Nombre = Nombre.trim();
      if (Telefono !== undefined) updateData.Telefono = Telefono ? Telefono.trim() : null;
      if (Estado !== undefined) updateData.Estado = Estado;
      if (RolId !== undefined) updateData.RolId = Number(RolId);

      if (EIN !== undefined) {
        const einLimpio = EIN.trim();
        const existente = await EmpresariaModel.findByEIN(einLimpio);
        if (existente && existente.IdEmpresaria !== Number(id)) {
          return res.status(409).json({
            success: false,
            message: `El EIN '${einLimpio}' ya pertenece a otra empresaria`
          });
        }
        updateData.EIN = einLimpio;
      }

      if (PorcentajeDescuento !== undefined) {
        const desc = Number(PorcentajeDescuento);
        if (isNaN(desc) || desc < 0 || desc > 100) {
          return res.status(400).json({
            success: false,
            message: 'El porcentaje de descuento debe ser un número entre 0 y 100'
          });
        }
        updateData.PorcentajeDescuento = desc;
      }

      // Si se envía una nueva contraseña, la hasheamos
      if (Password && Password.trim() !== '') {
        if (Password.trim().length < 4) {
          return res.status(400).json({
            success: false,
            message: 'La nueva contraseña debe tener al menos 4 caracteres'
          });
        }
        updateData.Password = await bcrypt.hash(Password.trim(), 10);
      }

      const updated = await EmpresariaModel.update(id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: `Empresaria con ID '${id}' no encontrada o sin cambios detectados`
        });
      }

      const empresariaActualizada = await EmpresariaModel.getById(id);

      return res.status(200).json({
        success: true,
        message: 'Información actualizada exitosamente',
        data: empresariaActualizada
      });
    } catch (error) {
      console.error('Error en updateEmpresaria:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar la empresaria',
        error: error.message
      });
    }
  },

  /**
   * DELETE /api/empresarias/:id
   * Elimina una empresaria.
   */
  async deleteEmpresaria(req, res) {
    try {
      const { id } = req.params;
      const deleted = await EmpresariaModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `Empresaria con ID '${id}' no encontrada`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Empresaria eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error en deleteEmpresaria:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar la empresaria. Verifique que no tenga registros vinculados (ventas, stock)',
        error: error.message
      });
    }
  }
};

export default EmpresariaController;
