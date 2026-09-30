import pool from '../config/db.js';

/**
 * Modelo de Acceso a Datos (DAO) para `stock_empresarias` e `inventory_movements`.
 */
export const InventarioModel = {
  /**
   * Obtiene el inventario y stock de una empresaria.
   * Por defecto (scope: 'mi_stock') utiliza INNER JOIN para consultar únicamente las piezas
   * que la empresaria tiene en stock activo (Stock > 0), garantizando escalabilidad para miles de usuarios.
   * 
   * @param {number} empresariaId
   * @param {Object} options
   * @param {string} [options.scope='mi_stock'] - 'mi_stock' (Stock > 0), 'agotados' (Stock = 0), 'mi_historial' (todo su stock), 'catalogo_global' (todas las joyas)
   * @param {string} [options.categoria]
   * @param {string} [options.search]
   * @param {boolean} [options.soloConStock]
   */
  async getStockByEmpresaria(empresariaId, { categoria, search, scope = 'mi_stock', soloConStock } = {}) {
    const empId = Number(empresariaId);
    let effectiveScope = scope;
    if (soloConStock === true || soloConStock === 'true') effectiveScope = 'mi_stock';
    if (soloConStock === false || soloConStock === 'false') effectiveScope = 'catalogo_global';

    let sql = '';
    const params = [];
    const conditions = [];

    if (effectiveScope === 'catalogo_global' || effectiveScope === 'todos') {
      // Búsqueda en catálogo maestro completo (LEFT JOIN)
      sql = `
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
      params.push(empId);
    } else {
      // Consultas optimizadas por índice (INNER JOIN) sobre stock_empresarias
      sql = `
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
          se.Stock,
          se.updated_at AS UltimaActualizacion
        FROM stock_empresarias se
        INNER JOIN productos p 
          ON se.ProductoId = p.id
      `;
      conditions.push('se.EmpresariaId = ?');
      params.push(empId);

      if (effectiveScope === 'mi_stock') {
        conditions.push('se.Stock > 0');
      } else if (effectiveScope === 'agotados') {
        conditions.push('se.Stock = 0');
      }
    }

    if (categoria && categoria !== 'Todos') {
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
   * Obtiene el historial de movimientos de inventario (Kardex) de una empresaria.
   * Permite filtrar por joya específica (ProductoId) y por tipo de movimiento.
   */
  async getMovimientos(empresariaId, { productoId, tipo, limit = 50, offset = 0 } = {}) {
    let sql = `
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
      LEFT JOIN productos p ON im.ProductoId = p.id
      WHERE im.EmpresariaId = ?
    `;
    const params = [empresariaId];

    if (productoId) {
      sql += ' AND im.ProductoId = ?';
      params.push(String(productoId).trim());
    }

    if (tipo) {
      sql += ' AND im.tipo = ?';
      params.push(String(tipo).trim());
    }

    sql += ' ORDER BY im.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(sql, params);
    return rows;
  }
};
