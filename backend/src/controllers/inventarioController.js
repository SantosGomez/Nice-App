import { InventarioModel } from '../models/inventarioModel.js';

/**
 * Controlador de Inventario y Control de Stock Multi-Empresaria.
 */
export const InventarioController = {
  /**
   * GET /api/inventario/stock/:empresariaId
   * Obtiene el inventario y stock de una empresaria con filtros opcionales.
   */
  async getStock(req, res) {
    try {
      const { empresariaId } = req.params;
      const { categoria, search } = req.query;

      if (!empresariaId) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la empresaria es obligatorio'
        });
      }

      const stock = await InventarioModel.getStockByEmpresaria(Number(empresariaId), {
        categoria,
        search
      });

      return res.status(200).json({
        success: true,
        count: stock.length,
        data: stock
      });
    } catch (error) {
      console.error('Error en getStock:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al consultar el stock',
        error: error.message
      });
    }
  },

  /**
   * POST /api/inventario/movimiento
   * Registra una entrada (por QR o manual), salida o ajuste en el inventario.
   */
  async registrarMovimiento(req, res) {
    try {
      const { ProductoId, EmpresariaId, tipo, Quantity, Notas } = req.body;

      // Validaciones
      if (!ProductoId || !EmpresariaId || !tipo || Quantity === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Los campos ProductoId, EmpresariaId, tipo y Quantity son obligatorios'
        });
      }

      const tiposValidos = ['IN_QR', 'MANUAL_IN', 'SALE_OUT', 'ADJUSTMENT'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({
          success: false,
          message: `El campo 'tipo' debe ser uno de: ${tiposValidos.join(', ')}`
        });
      }

      const cantidadNum = Number(Quantity);
      if (isNaN(cantidadNum) || cantidadNum === 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser un número diferente de cero'
        });
      }

      const resultado = await InventarioModel.registrarMovimiento({
        ProductoId,
        EmpresariaId: Number(EmpresariaId),
        tipo,
        Quantity: Math.abs(cantidadNum),
        Notas
      });

      return res.status(201).json({
        success: true,
        message: 'Movimiento de inventario registrado correctamente',
        data: resultado
      });
    } catch (error) {
      console.error('Error en registrarMovimiento:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al registrar el movimiento de inventario',
        error: error.message
      });
    }
  },

  /**
   * GET /api/inventario/movimientos/:empresariaId
   * Obtiene el histórico de movimientos de inventario de una empresaria.
   */
  async getMovimientos(req, res) {
    try {
      const { empresariaId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const movimientos = await InventarioModel.getMovimientos(Number(empresariaId), {
        limit,
        offset
      });

      return res.status(200).json({
        success: true,
        count: movimientos.length,
        data: movimientos
      });
    } catch (error) {
      console.error('Error en getMovimientos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener el historial de movimientos',
        error: error.message
      });
    }
  }
};
