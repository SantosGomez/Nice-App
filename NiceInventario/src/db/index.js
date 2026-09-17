import Dexie from 'dexie';

/**
 * Instancia de base de datos local Dexie (IndexedDB) para Nice POS.
 * Funciona 100% offline en tablets e iPads, replicando las tablas del servidor.
 */
export const db = new Dexie('NiceAppDB');

// Definición de Esquema y Versiones de IndexedDB
db.version(1).stores({
  // Catálogo maestro de productos
  productos: 'id, sku, CodigoQr, Nombre, Categoria, Catalogo, Precio, updated_at',

  // Stock local asignado a cada empresaria
  // [EmpresariaId+ProductoId] es la clave primaria compuesta
  stock_empresarias: '[EmpresariaId+ProductoId], EmpresariaId, ProductoId, Stock, updated_at',

  // Clientes locales
  clientes: '++IdCliente, Nombre, Telefono, localOnly',

  // Registro de ventas generadas en la tablet
  ventas: 'IdVenta, Cliente_Id, EmpresariaId, TipoVenta, Estado, synced, created_at',

  // Partidas de cada venta
  sale_items: '++Id_sale_items, VentaId, ProductoId',

  // Pagos o abonos realizados
  pagos: '++IdPago, VentaId, Metodo_Pago, created_at',

  // Movimientos locales de inventario
  inventory_movements: '++IdInventario, ProductoId, EmpresariaId, tipo, created_at',

  // Cola de sincronización para operaciones pendientes de enviar a la nube
  sync_queue: '++id, type, action, createdAt, attempts'
});

db.version(2).stores({
  clientes: '++IdCliente, EmpresariaId, Nombre, Telefono, localOnly'
});

/**
 * Helper para registrar una venta offline de forma atómica en Dexie.
 * Actualiza ventas, partidas, pagos, descuenta el stock local y encola para sincronizar.
 */
db.guardarVentaOffline = async function ({
  IdVenta,
  Cliente_Id = null,
  EmpresariaId = 1,
  TipoVenta = 'DIRECTA',
  Estado = 'COMPLETADA',
  total,
  TotalCosto = 0.0,
  items = [],
  pagos = []
}) {
  const empId = Number(EmpresariaId);
  return await db.transaction(
    'rw',
    [db.ventas, db.sale_items, db.pagos, db.stock_empresarias, db.inventory_movements, db.sync_queue],
    async () => {
      const now = new Date().toISOString();

      // 1. Guardar cabecera de venta
      await db.ventas.put({
        IdVenta,
        Cliente_Id,
        EmpresariaId: empId,
        TipoVenta,
        Estado,
        total: Number(total),
        TotalCosto: Number(TotalCosto),
        synced: 0, // Pendiente de sincronizar
        created_at: now
      });

      // 2. Guardar partidas y descontar stock local
      for (const item of items) {
        await db.sale_items.add({
          VentaId: IdVenta,
          ProductoId: item.ProductoId,
          Precio_unit: Number(item.Precio_unit),
          Costo_unit: Number(item.Costo_unit || 0),
          Cantidad: Number(item.Cantidad)
        });

        // Descontar de stock_empresarias local
        const stockRecord = await db.stock_empresarias.get([empId, item.ProductoId]);
        const stockActual = stockRecord ? Number(stockRecord.Stock) : 0;
        const nuevoStock = Math.max(0, stockActual - Number(item.Cantidad));

        await db.stock_empresarias.put({
          EmpresariaId: empId,
          ProductoId: item.ProductoId,
          Stock: nuevoStock,
          updated_at: now
        });

        // Registrar movimiento local
        await db.inventory_movements.add({
          ProductoId: item.ProductoId,
          EmpresariaId: empId,
          tipo: 'SALE_OUT',
          Quantity: Number(item.Cantidad),
          Notas: `Venta POS Offline #${IdVenta.substring(0, 8)}`,
          created_at: now
        });
      }

      // 3. Guardar pagos
      for (const pago of pagos) {
        if (pago && Number(pago.Cantidad) > 0) {
          await db.pagos.add({
            VentaId: IdVenta,
            Cantidad: Number(pago.Cantidad),
            Metodo_Pago: pago.Metodo_Pago || 'Efectivo',
            created_at: now
          });
        }
      }

      // 4. Encolar en sync_queue
      await db.sync_queue.add({
        type: 'VENTA',
        action: 'CREATE',
        payload: {
          IdVenta,
          Cliente_Id,
          EmpresariaId: empId,
          TipoVenta,
          Estado,
          total: Number(total),
          TotalCosto: Number(TotalCosto),
          items,
          pagos
        },
        createdAt: now,
        attempts: 0
      });

      return { IdVenta, total, status: 'saved_locally' };
    }
  );
};

/**
 * Obtiene los productos combinados con su stock local para la empresaria actual sin duplicaciones.
 */
db.obtenerCatalogoConStock = async function (empresariaId) {
  const empId = Number(empresariaId || 1);
  const [productos, stockList] = await Promise.all([
    db.productos.toArray(),
    db.stock_empresarias.where('EmpresariaId').equals(empId).toArray()
  ]);

  const stockMap = new Map();
  stockList.forEach((s) => {
    if (s && s.ProductoId) {
      stockMap.set(String(s.ProductoId).trim(), Number(s.Stock) || 0);
    }
  });

  const uniqueMap = new Map();
  productos.forEach((prod) => {
    if (prod) {
      const prodId = String(prod.id || prod.ProductoId || prod.sku || '').trim();
      if (prodId && !uniqueMap.has(prodId)) {
        uniqueMap.set(prodId, {
          ...prod,
          id: prodId,
          ProductoId: prodId,
          Stock: stockMap.get(prodId) || 0
        });
      }
    }
  });

  return Array.from(uniqueMap.values());
};

export default db;
