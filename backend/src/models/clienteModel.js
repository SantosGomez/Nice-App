import pool from '../config/db.js';

/**
 * Modelo de Acceso a Datos (DAO) para la tabla `clientes`.
 * Soporta asignación por empresaria/distribuidora.
 */
export const ClienteModel = {
  /**
   * Obtiene todos los clientes, con opción de filtrado por empresaria y búsqueda por nombre o teléfono.
   * @param {Object} [filter]
   * @param {string} [filter.search]
   * @param {number|string} [filter.empresariaId]
   */
  async getAll({ search, empresariaId } = {}) {
    let sql = `
      SELECT 
        c.IdCliente,
        c.EmpresariaId,
        COALESCE(e.Nombre, 'Sin asignar') AS EmpresariaNombre,
        c.Nombre,
        c.Telefono,
        c.Nota
      FROM clientes c
      LEFT JOIN empresarias e ON c.EmpresariaId = e.IdEmpresaria
      WHERE 1 = 1
    `;
    const params = [];

    if (empresariaId) {
      sql += ` AND c.EmpresariaId = ?`;
      params.push(Number(empresariaId));
    }

    if (search) {
      sql += ` AND (c.Nombre LIKE ? OR c.Telefono LIKE ?)`;
      const searchWildcard = `%${search.trim()}%`;
      params.push(searchWildcard, searchWildcard);
    }

    sql += ` ORDER BY c.Nombre ASC`;

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Obtiene un cliente por su IdCliente.
   */
  async getById(id) {
    const sql = `
      SELECT 
        c.IdCliente,
        c.EmpresariaId,
        COALESCE(e.Nombre, 'Sin asignar') AS EmpresariaNombre,
        c.Nombre,
        c.Telefono,
        c.Nota
      FROM clientes c
      LEFT JOIN empresarias e ON c.EmpresariaId = e.IdEmpresaria
      WHERE c.IdCliente = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Inserta un nuevo cliente con empresaria asignada.
   */
  async create({ Nombre, Telefono = null, Nota = null, EmpresariaId = null }) {
    const sql = `
      INSERT INTO clientes (EmpresariaId, Nombre, Telefono, Nota)
      VALUES (?, ?, ?, ?)
    `;
    const empId = EmpresariaId ? Number(EmpresariaId) : null;
    const [result] = await pool.query(sql, [empId, Nombre, Telefono, Nota]);
    return {
      IdCliente: result.insertId,
      EmpresariaId: empId,
      Nombre,
      Telefono,
      Nota
    };
  },

  /**
   * Actualiza un cliente existente.
   */
  async update(id, { Nombre, Telefono, Nota, EmpresariaId }) {
    const fields = [];
    const params = [];

    if (Nombre !== undefined) { fields.push('Nombre = ?'); params.push(Nombre); }
    if (Telefono !== undefined) { fields.push('Telefono = ?'); params.push(Telefono); }
    if (Nota !== undefined) { fields.push('Nota = ?'); params.push(Nota); }
    if (EmpresariaId !== undefined) { fields.push('EmpresariaId = ?'); params.push(EmpresariaId ? Number(EmpresariaId) : null); }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE clientes SET ${fields.join(', ')} WHERE IdCliente = ?`;
    const [result] = await pool.query(sql, params);
    return result.affectedRows > 0;
  },

  /**
   * Elimina un cliente por su IdCliente.
   */
  async delete(id) {
    const sql = `DELETE FROM clientes WHERE IdCliente = ?`;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }
};

export default ClienteModel;
