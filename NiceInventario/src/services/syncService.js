import api from './api.js';
import db from '../db/index.js';

/**
 * Servicio de Sincronización Offline-First.
 * Conecta la base de datos local IndexedDB (Dexie) con el servidor MySQL/Express.
 */
export const SyncService = {
  /**
   * Descarga catálogo, stock y clientes del servidor hacia Dexie.js (Pull).
   */
  async pullFromServer(empresariaId = 1) {
    try {
      const response = await api.get(`/sync/pull?empresariaId=${empresariaId}`);
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Error en respuesta del servidor');
      }

      const { productos, stock, clientes } = response.data.data;

      // 1. Guardar productos en Dexie
      if (productos && productos.length > 0) {
        await db.productos.bulkPut(productos);
      }

      // 2. Guardar stock de la empresaria en Dexie
      if (stock && stock.length > 0) {
        const stockItems = stock.map((s) => ({
          EmpresariaId: Number(empresariaId),
          ProductoId: s.ProductoId,
          Stock: Number(s.Stock),
          updated_at: s.UltimaActualizacion || new Date().toISOString()
        }));
        await db.stock_empresarias.bulkPut(stockItems);
      }

      // 3. Guardar clientes en Dexie
      if (clientes && clientes.length > 0) {
        await db.clientes.bulkPut(clientes);
      }

      const syncTime = response.data.serverTimestamp || new Date().toISOString();
      localStorage.setItem('nice_last_sync', syncTime);

      return {
        success: true,
        serverTimestamp: syncTime,
        productosActualizados: productos ? productos.length : 0,
        clientesActualizados: clientes ? clientes.length : 0
      };
    } catch (error) {
      console.warn('[SyncService] No fue posible hacer Pull:', error.message);
      throw error;
    }
  },

  /**
   * Sube las ventas y clientes creados offline hacia el servidor (Push).
   */
  async pushToServer() {
    try {
      // 1. Obtener ventas pendientes de sincronizar
      const ventasPendientes = await db.ventas.where('synced').equals(0).toArray();

      // 2. Obtener clientes locales nuevos
      const clientesPendientes = await db.clientes.where('localOnly').equals(1).toArray();

      if (ventasPendientes.length === 0 && clientesPendientes.length === 0) {
        return { success: true, message: 'No hay transacciones pendientes de sincronizar' };
      }

      // Reconstruir partidas y pagos para cada venta antes de enviar
      const ventasCompletas = [];
      for (const v of ventasPendientes) {
        const [items, pagos] = await Promise.all([
          db.sale_items.where('VentaId').equals(v.IdVenta).toArray(),
          db.pagos.where('VentaId').equals(v.IdVenta).toArray()
        ]);
        ventasCompletas.push({
          ...v,
          items,
          pagos
        });
      }

      // 3. Enviar lote al backend
      const payload = {
        clientes: clientesPendientes,
        ventas: ventasCompletas
      };

      const response = await api.post('/sync/push', payload);

      if (response.data && response.data.success) {
        // Marcar ventas locales como sincronizadas (synced = 1)
        for (const v of ventasPendientes) {
          await db.ventas.update(v.IdVenta, { synced: 1 });
        }

        // Marcar clientes como no-locales
        for (const c of clientesPendientes) {
          await db.clientes.update(c.IdCliente, { localOnly: 0 });
        }

        // Limpiar elementos procesados de la cola de sync
        await db.sync_queue.clear();

        return {
          success: true,
          ventasSincronizadas: ventasPendientes.length,
          clientesSincronizados: clientesPendientes.length
        };
      } else {
        throw new Error(response.data?.message || 'Error en Push del servidor');
      }
    } catch (error) {
      console.warn('[SyncService] No fue posible hacer Push:', error.message);
      throw error;
    }
  },

  /**
   * Realiza una sincronización bidireccional completa (Push primero y luego Pull).
   */
  async fullSync(empresariaId = 1) {
    let pushResult = null;
    try {
      pushResult = await this.pushToServer();
    } catch (pushErr) {
      console.warn('[SyncService] Push falló o sin red:', pushErr.message);
    }

    const pullResult = await this.pullFromServer(empresariaId);
    return {
      push: pushResult,
      pull: pullResult
    };
  },

  /**
   * Consulta la cantidad de registros locales pendientes de sincronizar.
   */
  async getPendingCount() {
    try {
      const count = await db.ventas.where('synced').equals(0).count();
      return count;
    } catch {
      return 0;
    }
  }
};

export default SyncService;
