import pool from '../config/db.js';

/**
 * Modelo de Acceso a Datos (DAO) para la tabla `clientes`.
 */
export const ClienteModel = {
  /**
   * Obtiene todos los clientes, con opción de búsqueda por nombre o teléfono.
   */
  async getAll({ search } = {}) {
    let sql = `
      SELECT 
        IdCliente,
        Nombre,
        Telefono,
        Nota
      FROM clientes
    `;
    const params = [];

    if (search) {
      sql += ` WHERE Nombre LIKE ? OR Telefono LIKE ?`;
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard);
    }

    sql += ` ORDER BY Nombre ASC`;

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Obtiene un cliente por su IdCliente.
   */
  async getById(id) {
    const sql = `
      SELECT 
        IdCliente,
        Nombre,
        Telefono,
        Nota
      FROM clientes
      WHERE IdCliente = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Inserta un nuevo cliente.
   */
  async create({ Nombre, Telefono = null, Nota = null }) {
    const sql = `
      INSERT INTO clientes (Nombre, Telefono, Nota)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(sql, [Nombre, Telefono, Nota]);
    return {
      IdCliente: result.insertId,
      Nombre,
      Telefono,
      Nota
    };
  },

  /**
   * Actualiza un cliente existente.
   */
  async update(id, { Nombre, Telefono, Nota }) {
    const fields = [];
    const params = [];

    if (Nombre !== undefined) { fields.push('Nombre = ?'); params.push(Nombre); }
    if (Telefono !== undefined) { fields.push('Telefono = ?'); params.push(Telefono); }
    if (Nota !== undefined) { fields.push('Nota = ?'); params.push(Nota); }

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
