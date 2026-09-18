import pool from '../config/db.js';

/**
 * Modelo de Acceso a Datos (DAO) para la tabla `productos`.
 * Incluye soporte multi-empresaria para consultar stock específico de cada empresaria.
 */
export const ProductoModel = {
  /**
   * Obtiene todos los productos, con soporte opcional de filtro por empresaria y búsqueda.
   * @param {Object} options
   * @param {number|string} [options.empresariaId] - ID de la empresaria para calcular su stock local
   * @param {string} [options.search] - Texto de búsqueda por SKU, Nombre o Código QR
   * @param {string} [options.categoria] - Categoría específica
   */
  async getAll({ empresariaId, search, categoria } = {}) {
    let sql = `
      SELECT 
        p.id,
        p.sku,
        p.CodigoQr,
        p.Nombre,
        p.Categoria,
        p.Catalogo,
        p.Precio,
        p.PrecioCosto,
        p.ImgURL,
        p.updated_at
    `;

    const params = [];

    if (empresariaId) {
      sql += `, COALESCE(se.Stock, 0) AS Stock
        FROM productos p
        LEFT JOIN stock_empresarias se 
          ON p.id = se.ProductoId AND se.EmpresariaId = ?
      `;
      params.push(empresariaId);
    } else {
      sql += `
        FROM productos p
      `;
    }

    const conditions = [];

    if (search) {
      conditions.push(`(p.Nombre LIKE ? OR p.sku LIKE ? OR p.CodigoQr LIKE ?)`);
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard);
    }

    if (categoria) {
      conditions.push(`p.Categoria = ?`);
      params.push(categoria);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY p.Nombre ASC`;

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Busca un producto por su ID primario.
   */
  async getById(id, empresariaId = null) {
    let sql = `
      SELECT 
        p.id,
        p.sku,
        p.CodigoQr,
        p.Nombre,
        p.Categoria,
        p.Catalogo,
        p.Precio,
        p.PrecioCosto,
        p.ImgURL,
        p.updated_at
    `;
    const params = [];

    if (empresariaId) {
      sql += `, COALESCE(se.Stock, 0) AS Stock
        FROM productos p
        LEFT JOIN stock_empresarias se 
          ON p.id = se.ProductoId AND se.EmpresariaId = ?
        WHERE p.id = ?
      `;
      params.push(empresariaId, id);
    } else {
      sql += ` FROM productos p WHERE p.id = ?`;
      params.push(id);
    }

    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  },

  /**
   * Busca un producto por SKU o Código QR (ideal para el lector de código de barras / escáner QR del POS).
   */
  async findByCode(code, empresariaId = null) {
    let sql = `
      SELECT 
        p.id,
        p.sku,
        p.CodigoQr,
        p.Nombre,
        p.Categoria,
        p.Catalogo,
        p.Precio,
        p.PrecioCosto,
        p.ImgURL,
        p.updated_at
    `;
    const params = [];

    if (empresariaId) {
      sql += `, COALESCE(se.Stock, 0) AS Stock
        FROM productos p
        LEFT JOIN stock_empresarias se 
          ON p.id = se.ProductoId AND se.EmpresariaId = ?
        WHERE p.sku = ? OR p.CodigoQr = ? OR p.id = ?
      `;
      params.push(empresariaId, code, code, code);
    } else {
      sql += ` FROM productos p WHERE p.sku = ? OR p.CodigoQr = ? OR p.id = ?`;
      params.push(code, code, code);
    }

    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  },

  /**
   * Inserta un nuevo producto y opcionalmente su stock inicial.
   */
  async create({ id, sku, CodigoQr, Nombre, Categoria, Catalogo, Precio, PrecioCosto = 0.0, ImgURL = null, StockInicial = 0, EmpresariaId = null }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const sql = `
        INSERT INTO productos (id, sku, CodigoQr, Nombre, Categoria, Catalogo, Precio, PrecioCosto, ImgURL)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await connection.query(sql, [
        id,
        sku,
        CodigoQr || null,
        Nombre,
        Categoria,
        Catalogo,
        Precio,
        PrecioCosto,
        ImgURL
      ]);

      const stockNum = Number(StockInicial || 0);
      if (stockNum > 0 && EmpresariaId) {
        const empId = Number(EmpresariaId);
        const sqlStock = `
          INSERT INTO stock_empresarias (EmpresariaId, ProductoId, Stock)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE Stock = Stock + ?
        `;
        await connection.query(sqlStock, [empId, id, stockNum, stockNum]);

        const sqlMov = `
          INSERT INTO inventory_movements (ProductoId, EmpresariaId, tipo, Quantity, Notas)
          VALUES (?, ?, 'IN_QR', ?, 'Inventario inicial al registrar joya')
        `;
        await connection.query(sqlMov, [id, empId, stockNum]);
      }

      await connection.commit();
      return { id, sku, Nombre, Stock: stockNum };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Actualiza los datos de un producto existente.
   */
  async update(id, { sku, CodigoQr, Nombre, Categoria, Catalogo, Precio, PrecioCosto, ImgURL }) {
    const fields = [];
    const params = [];

    if (sku !== undefined) { fields.push('sku = ?'); params.push(sku); }
    if (CodigoQr !== undefined) { fields.push('CodigoQr = ?'); params.push(CodigoQr); }
    if (Nombre !== undefined) { fields.push('Nombre = ?'); params.push(Nombre); }
    if (Categoria !== undefined) { fields.push('Categoria = ?'); params.push(Categoria); }
    if (Catalogo !== undefined) { fields.push('Catalogo = ?'); params.push(Catalogo); }
    if (Precio !== undefined) { fields.push('Precio = ?'); params.push(Precio); }
    if (PrecioCosto !== undefined) { fields.push('PrecioCosto = ?'); params.push(PrecioCosto); }
    if (ImgURL !== undefined) { fields.push('ImgURL = ?'); params.push(ImgURL); }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE productos SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(sql, params);
    return result.affectedRows > 0;
  },

  /**
   * Elimina un producto por ID.
   */
  async delete(id) {
    const sql = `DELETE FROM productos WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }
};
