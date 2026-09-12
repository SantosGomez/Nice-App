import { ProductoModel } from '../models/productoModel.js';
import { EmpresariaModel } from '../models/empresariaModel.js';
import { ClienteModel } from '../models/clienteModel.js';
import { InventarioModel } from '../models/inventarioModel.js';
import { VentaModel } from '../models/ventaModel.js';

/**
 * Controlador de Sincronización Offline-First.
 * Permite a las tablets descargar el catálogo maestro y subir transacciones generadas sin conexión.
 */
export const SyncController = {
  /**
   * GET /api/sync/pull
   * Descarga todos los datos maestros para inicializar o refrescar la base de datos local Dexie.js (IndexedDB).
   */
  async pull(req, res) {
    try {
      const { empresariaId } = req.query;
      const empId = empresariaId ? Number(empresariaId) : 1;

      // Obtener en paralelo los datos necesarios para la tablet
      const [productos, stock, clientes, empresarias] = await Promise.all([
        ProductoModel.getAll(),
        InventarioModel.getStockByEmpresaria(empId),
        ClienteModel.getAll(),
        EmpresariaModel.getAll({ estado: 'Activa' })
      ]);

      return res.status(200).json({
        success: true,
        serverTimestamp: new Date().toISOString(),
        empresariaId: empId,
        data: {
          productos,
          stock,
          clientes,
          empresarias
        }
      });
    } catch (error) {
      console.error('Error en sync.pull:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener datos para sincronización',
        error: error.message
      });
    }
  },

  /**
   * POST /api/sync/push
   * Recibe lote de datos generados offline en la tablet (clientes nuevos, ventas offline).
   */
  async push(req, res) {
    try {
      const { clientes = [], ventas = [] } = req.body;

      const resultados = {
        clientesCreados: 0,
        ventasResultados: null,
        serverTimestamp: new Date().toISOString()
      };

      // 1. Sincronizar clientes creados offline
      for (const c of clientes) {
        if (c.Nombre) {
          try {
            await ClienteModel.create({
              Nombre: c.Nombre,
              Telefono: c.Telefono || null,
              Nota: c.Nota || null
            });
            resultados.clientesCreados++;
          } catch (err) {
            console.warn(`[Sync] Aviso al sincronizar cliente ${c.Nombre}:`, err.message);
          }
        }
      }

      // 2. Sincronizar lote de ventas generadas offline
      if (Array.isArray(ventas) && ventas.length > 0) {
        resultados.ventasResultados = await VentaModel.procesarLoteOffline(ventas);
      }

      return res.status(200).json({
        success: true,
        message: 'Sincronización procesada correctamente',
        data: resultados
      });
    } catch (error) {
      console.error('Error en sync.push:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al procesar sincronización offline',
        error: error.message
      });
    }
  }
};
