import { ClienteModel } from '../models/clienteModel.js';

/**
 * Controlador de Clientes.
 */
export const ClienteController = {
  /**
   * GET /api/clientes
   * Obtiene la lista de clientes con soporte para búsqueda y filtro por empresaria.
   */
  async getClientes(req, res) {
    try {
      const { search, empresariaId } = req.query;
      const clientes = await ClienteModel.getAll({ search, empresariaId });

      return res.status(200).json({
        success: true,
        count: clientes.length,
        data: clientes
      });
    } catch (error) {
      console.error('Error en getClientes:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de clientes',
        error: error.message
      });
    }
  },

  /**
   * GET /api/clientes/:id
   * Obtiene un cliente por su IdCliente.
   */
  async getClienteById(req, res) {
    try {
      const { id } = req.params;
      const cliente = await ClienteModel.getById(id);

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: `Cliente con ID '${id}' no encontrado`
        });
      }

      return res.status(200).json({
        success: true,
        data: cliente
      });
    } catch (error) {
      console.error('Error en getClienteById:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener el cliente',
        error: error.message
      });
    }
  },

  /**
   * POST /api/clientes
   * Registra un nuevo cliente.
   */
  async createCliente(req, res) {
    try {
      const { Nombre, Telefono, Nota, EmpresariaId } = req.body;

      if (!Nombre || Nombre.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre del cliente es obligatorio'
        });
      }

      const nuevoCliente = await ClienteModel.create({
        Nombre: Nombre.trim(),
        Telefono: Telefono ? Telefono.trim() : null,
        Nota: Nota ? Nota.trim() : null,
        EmpresariaId: EmpresariaId ? Number(EmpresariaId) : null
      });

      return res.status(201).json({
        success: true,
        message: 'Cliente registrado exitosamente',
        data: nuevoCliente
      });
    } catch (error) {
      console.error('Error en createCliente:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al registrar el cliente',
        error: error.message
      });
    }
  },

  /**
   * PUT /api/clientes/:id
   * Actualiza los datos de un cliente.
   */
  async updateCliente(req, res) {
    try {
      const { id } = req.params;
      const { Nombre, Telefono, Nota, EmpresariaId } = req.body;

      const updated = await ClienteModel.update(id, {
        Nombre: Nombre ? Nombre.trim() : undefined,
        Telefono: Telefono !== undefined ? (Telefono ? Telefono.trim() : null) : undefined,
        Nota: Nota !== undefined ? (Nota ? Nota.trim() : null) : undefined,
        EmpresariaId: EmpresariaId !== undefined ? (EmpresariaId ? Number(EmpresariaId) : null) : undefined
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: `Cliente con ID '${id}' no encontrado o sin cambios`
        });
      }

      const clienteActualizado = await ClienteModel.getById(id);

      return res.status(200).json({
        success: true,
        message: 'Cliente actualizado exitosamente',
        data: clienteActualizado
      });
    } catch (error) {
      console.error('Error en updateCliente:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar el cliente',
        error: error.message
      });
    }
  },

  /**
   * DELETE /api/clientes/:id
   * Elimina un cliente.
   */
  async deleteCliente(req, res) {
    try {
      const { id } = req.params;
      const deleted = await ClienteModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `Cliente con ID '${id}' no encontrado`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cliente eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error en deleteCliente:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar el cliente. Verifique que no tenga ventas vinculadas',
        error: error.message
      });
    }
  }
};

export default ClienteController;
