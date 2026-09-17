import pool from '../config/db.js';

/**
 * Modelo de Acceso a Datos (DAO) para `stock_empresarias` e `inventory_movements`.
 */
export const InventarioModel = {
  /**
   * Obtiene el inventario completo y stock actual de una empresaria.
   */
  async getStockByEmpresaria(empresariaId, { categoria, search } = {}) {
    let sql = `
      SELECT 
        p.id,
        p.id AS ProductoId,
        p.sku,
        p.CodigoQr,
        p.Nombre,
        p.Categoria,
        p.Catalogo,
        p.Precio,
        p.PrecioCosto,
        p.ImgURL,
        COALESCE(se.Stock, 0) AS Stock,
        se.updated_at AS UltimaActualizacion
      FROM productos p
      LEFT JOIN stock_empresarias se 
        ON p.id = se.ProductoId AND se.EmpresariaId = ?
    `;
    const params = [empresariaId];
    const conditions = [];

    if (categoria) {
      conditions.push('p.Categoria = ?');
      params.push(categoria);
    }

    if (search) {
      conditions.push('(p.Nombre LIKE ? OR p.sku LIKE ? OR p.CodigoQr LIKE ?)');
      const wildcard = `%${search}%`;
      params.push(wildcard, wildcard, wildcard);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY p.Nombre ASC`;

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Registra un movimiento de inventario y actualiza el stock de la empresaria.
   * Acepta un `dbClient` opcional (para ejecutarlo dentro de transacciones de venta).
   */
  async registrarMovimiento(
    { ProductoId, EmpresariaId, tipo, Quantity, Notas = null },
    dbClient = null
  ) {
    const client = dbClient || pool;

    // 1. Insertar movimiento en inventory_movements
    const sqlMovimiento = `
      INSERT INTO inventory_movements (ProductoId, EmpresariaId, tipo, Quantity, Notas)
      VALUES (?, ?, ?, ?, ?)
    `;
    await client.query(sqlMovimiento, [ProductoId, EmpresariaId, tipo, Quantity, Notas]);

    // 2. Determinar delta de stock
    let delta = 0;
    if (tipo === 'IN_QR' || tipo === 'MANUAL_IN') {
      delta = Quantity;
    } else if (tipo === 'SALE_OUT') {
      delta = -Quantity;
    } else if (tipo === 'ADJUSTMENT') {
      delta = Quantity; // Quantity puede ser positivo o negativo en un ajuste
    }

    // 3. Actualizar o insertar en stock_empresarias
    const sqlStock = `
      INSERT INTO stock_empresarias (EmpresariaId, ProductoId, Stock)
      VALUES (?, ?, GREATEST(0, ?))
      ON DUPLICATE KEY UPDATE Stock = GREATEST(0, Stock + ?)
    `;
    await client.query(sqlStock, [EmpresariaId, ProductoId, delta, delta]);

    // 4. Retornar el stock actualizado
    const [rows] = await client.query(
      `SELECT Stock FROM stock_empresarias WHERE EmpresariaId = ? AND ProductoId = ?`,
      [EmpresariaId, ProductoId]
    );

    return {
      ProductoId,
      EmpresariaId,
      tipo,
      Quantity,
      StockActual: rows[0] ? rows[0].Stock : 0
    };
  },

  /**
   * Obtiene el historial de movimientos de inventario de una empresaria.
   */
  async getMovimientos(empresariaId, { limit = 50, offset = 0 } = {}) {
    const sql = `
      SELECT 
        im.IdInventario,
        im.ProductoId,
        p.Nombre AS ProductoNombre,
        p.sku,
        im.EmpresariaId,
        im.tipo,
        im.Quantity,
        im.Notas,
        im.created_at
      FROM inventory_movements im
      INNER JOIN productos p ON im.ProductoId = p.id
      WHERE im.EmpresariaId = ?
      ORDER BY im.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(sql, [
      empresariaId,
      Number(limit),
      Number(offset)
    ]);
    return rows;
  }
};
