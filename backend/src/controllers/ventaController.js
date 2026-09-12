import { VentaModel } from '../models/ventaModel.js';

/**
 * Controlador del Punto de Venta (POS) y Gestión de Ventas.
 */
export const VentaController = {
  /**
   * POST /api/ventas
   * Registra una venta completa (transacción con partidas, pagos y descuento de stock).
   */
  async crearVenta(req, res) {
    try {
      const {
        IdVenta,
        Cliente_Id,
        EmpresariaId,
        TipoVenta,
        Estado,
        total,
        TotalCosto,
        items,
        pagos
      } = req.body;

      // Validaciones mínimas de estructura de venta
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La venta debe incluir al menos un producto (items)'
        });
      }

      if (total === undefined || Number(total) < 0) {
        return res.status(400).json({
          success: false,
          message: 'El total de la venta es inválido'
        });
      }

      // Validar partidas individuales
      for (const item of items) {
        if (!item.ProductoId || !item.Precio_unit || !item.Cantidad || Number(item.Cantidad) <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Cada producto debe incluir ProductoId, Precio_unit y Cantidad mayor a 0'
          });
        }
      }

      const resultado = await VentaModel.crearVentaTransaccional({
        IdVenta,
        Cliente_Id: Cliente_Id ? Number(Cliente_Id) : null,
        EmpresariaId: EmpresariaId ? Number(EmpresariaId) : 1,
        TipoVenta: TipoVenta || 'DIRECTA',
        Estado: Estado || (TipoVenta === 'APARTADO' ? 'PENDIENTE' : 'COMPLETADA'),
        total: Number(total),
        TotalCosto: TotalCosto !== undefined ? Number(TotalCosto) : 0.0,
        items,
        pagos: pagos || [],
        synced: 1
      });

      return res.status(201).json({
        success: true,
        message: resultado.alreadyExisted
          ? 'La venta ya existía en el servidor (sincronización exitosa)'
          : 'Venta registrada exitosamente',
        data: resultado
      });
    } catch (error) {
      console.error('Error en crearVenta:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al procesar la venta',
        error: error.message
      });
    }
  },

  /**
   * GET /api/ventas
   * Obtiene la lista de ventas con filtros de fecha, empresaria, cliente y estado.
   */
  async getVentas(req, res) {
    try {
      const {
        empresariaId,
        clienteId,
        estado,
        tipoVenta,
        fechaInicio,
        fechaFin,
        limit,
        offset
      } = req.query;

      const ventas = await VentaModel.getAll({
        empresariaId: empresariaId ? Number(empresariaId) : null,
        clienteId: clienteId ? Number(clienteId) : null,
        estado,
        tipoVenta,
        fechaInicio,
        fechaFin,
        limit,
        offset
      });

      return res.status(200).json({
        success: true,
        count: ventas.length,
        data: ventas
      });
    } catch (error) {
      console.error('Error en getVentas:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al consultar las ventas',
        error: error.message
      });
    }
  },

  /**
   * GET /api/ventas/:id
   * Obtiene el desglose completo de una venta con partidas y pagos.
   */
  async getVentaById(req, res) {
    try {
      const { id } = req.params;
      const venta = await VentaModel.getById(id);

      if (!venta) {
        return res.status(404).json({
          success: false,
          message: `Venta con ID '${id}' no encontrada`
        });
      }

      return res.status(200).json({
        success: true,
        data: venta
      });
    } catch (error) {
      console.error('Error en getVentaById:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener el detalle de la venta',
        error: error.message
      });
    }
  },

  /**
   * POST /api/ventas/:id/pagos
   * Registra un nuevo abono o pago a una venta existente (ej. sistema de apartado).
   */
  async agregarPago(req, res) {
    try {
      const { id } = req.params;
      const { Cantidad, Metodo_Pago } = req.body;

      if (!Cantidad || Number(Cantidad) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad del pago debe ser mayor a 0'
        });
      }

      const resultado = await VentaModel.agregarPago(id, {
        Cantidad: Number(Cantidad),
        Metodo_Pago: Metodo_Pago || 'Efectivo'
      });

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: `Venta con ID '${id}' no encontrada`
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Pago registrado exitosamente',
        data: resultado
      });
    } catch (error) {
      console.error('Error en agregarPago:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al registrar el pago',
        error: error.message
      });
    }
  }
};
