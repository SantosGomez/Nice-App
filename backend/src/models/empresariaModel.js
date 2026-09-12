import pool from '../config/db.js';

/**
 * Modelo de Acceso a Datos (DAO) para la tabla `empresarias` y usuarios del sistema.
 * Soporta autenticación (EIN, Password, RolId) y control de distribución Nice.
 */
export const EmpresariaModel = {
  /**
   * Obtiene todas las empresarias/usuarios registradas con su rol correspondiente.
   * @param {Object} [filter]
   * @param {string} [filter.estado] - 'Activa' o 'Inactiva'
   * @param {number} [filter.rolId] - Filtrar por IdRol
   * @param {string} [filter.search] - Búsqueda por Nombre o EIN
   */
  async getAll({ estado, rolId, search } = {}) {
    let sql = `
      SELECT 
        e.IdEmpresaria,
        e.EIN,
        e.Nombre,
        e.Telefono,
        e.PorcentajeDescuento,
        e.Estado,
        e.RolId,
        COALESCE(r.Rol, 'Empresario') AS Rol,
        e.created_at
      FROM empresarias e
      LEFT JOIN roles r ON e.RolId = r.IdRol
      WHERE 1 = 1
    `;
    const params = [];

    if (estado) {
      sql += ` AND e.Estado = ?`;
      params.push(estado);
    }

    if (rolId !== undefined && rolId !== null && rolId !== '') {
      sql += ` AND e.RolId = ?`;
      params.push(Number(rolId));
    }

    if (search && search.trim() !== '') {
      sql += ` AND (e.Nombre LIKE ? OR e.EIN LIKE ? OR e.Telefono LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY e.Nombre ASC`;

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Busca una empresaria por su IdEmpresaria (excluyendo password).
   */
  async getById(id) {
    const sql = `
      SELECT 
        e.IdEmpresaria,
        e.EIN,
        e.Nombre,
        e.Telefono,
        e.PorcentajeDescuento,
        e.Estado,
        e.RolId,
        COALESCE(r.Rol, 'Empresario') AS Rol,
        e.created_at
      FROM empresarias e
      LEFT JOIN roles r ON e.RolId = r.IdRol
      WHERE e.IdEmpresaria = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Busca por EIN incluyendo Password para validación de login.
   */
  async findByEIN(ein) {
    const sql = `
      SELECT 
        e.IdEmpresaria,
        e.EIN,
        e.Password,
        e.Nombre,
        e.Telefono,
        e.PorcentajeDescuento,
        e.Estado,
        e.RolId,
        COALESCE(r.Rol, 'Empresario') AS Rol,
        e.created_at
      FROM empresarias e
      LEFT JOIN roles r ON e.RolId = r.IdRol
      WHERE e.EIN = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [ein]);
    return rows[0] || null;
  },

  /**
   * Crea una nueva empresaria / usuario.
   */
  async create({
    EIN,
    Password,
    Nombre,
    Telefono = null,
    PorcentajeDescuento = 25.0,
    Estado = 'Activa',
    RolId = 3
  }) {
    const sql = `
      INSERT INTO empresarias (EIN, Password, Nombre, Telefono, PorcentajeDescuento, Estado, RolId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      EIN,
      Password,
      Nombre,
      Telefono,
      PorcentajeDescuento,
      Estado,
      RolId
    ]);

    return {
      IdEmpresaria: result.insertId,
      EIN,
      Nombre,
      Telefono,
      PorcentajeDescuento,
      Estado,
      RolId
    };
  },

  /**
   * Actualiza los datos de una empresaria / usuario.
   */
  async update(id, { EIN, Password, Nombre, Telefono, PorcentajeDescuento, Estado, RolId }) {
    const fields = [];
    const params = [];

    if (EIN !== undefined) { fields.push('EIN = ?'); params.push(EIN); }
    if (Password !== undefined && Password !== null && Password !== '') {
      fields.push('Password = ?');
      params.push(Password);
    }
    if (Nombre !== undefined) { fields.push('Nombre = ?'); params.push(Nombre); }
    if (Telefono !== undefined) { fields.push('Telefono = ?'); params.push(Telefono); }
    if (PorcentajeDescuento !== undefined) { fields.push('PorcentajeDescuento = ?'); params.push(PorcentajeDescuento); }
    if (Estado !== undefined) { fields.push('Estado = ?'); params.push(Estado); }
    if (RolId !== undefined) { fields.push('RolId = ?'); params.push(RolId); }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE empresarias SET ${fields.join(', ')} WHERE IdEmpresaria = ?`;
    const [result] = await pool.query(sql, params);
    return result.affectedRows > 0;
  },

  /**
   * Elimina una empresaria por su ID.
   */
  async delete(id) {
    const sql = `DELETE FROM empresarias WHERE IdEmpresaria = ?`;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  },

  /**
   * Obtiene la lista de roles disponibles.
   */
  async getRoles() {
    const sql = `SELECT IdRol, Rol FROM roles ORDER BY IdRol ASC`;
    const [rows] = await pool.query(sql);
    return rows;
  }
};

export default EmpresariaModel;
