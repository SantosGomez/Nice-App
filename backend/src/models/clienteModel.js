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
  },

  /**
   * Obtiene la ficha completa e historial comercial (Kardex) de un cliente.
   */
  async getHistorial(clienteId) {
    const cliente = await this.getById(clienteId);
    if (!cliente) return null;

    // 1. Obtener todas las ventas asociadas a este cliente
    const [ventas] = await pool.query(
      `
      SELECT 
        v.IdVenta,
        v.EmpresariaId,
        COALESCE(e.Nombre, 'Distribuidora Nice') AS EmpresariaNombre,
        v.TipoVenta,
        v.Estado,
        v.total,
        v.created_at,
        COALESCE(SUM(p.Cantidad), 0) AS MontoPagado,
        (v.total - COALESCE(SUM(p.Cantidad), 0)) AS SaldoPendiente
      FROM ventas v
      LEFT JOIN empresarias e ON v.EmpresariaId = e.IdEmpresaria
      LEFT JOIN pagos p ON v.IdVenta = p.VentaId
      WHERE v.Cliente_Id = ?
      GROUP BY v.IdVenta
      ORDER BY v.created_at DESC
      `,
      [clienteId]
    );

    // 2. Obtener los renglones (joyas adquiridas) y pagos para cada venta
    const ventaIds = ventas.map((v) => v.IdVenta);
    const itemsPorVenta = {};
    const pagosPorVenta = {};

    if (ventaIds.length > 0) {
      const placeholders = ventaIds.map(() => '?').join(',');
      const [items] = await pool.query(
        `
        SELECT 
          si.VentaId,
          si.ProductoId,
          COALESCE(p.Nombre, 'Joya Nice') AS NombreProducto,
          si.Cantidad,
          si.Precio_unit
        FROM sale_items si
        LEFT JOIN productos p ON si.ProductoId = p.id
        WHERE si.VentaId IN (${placeholders})
        `,
        ventaIds
      );

      for (const item of items) {
        if (!itemsPorVenta[item.VentaId]) itemsPorVenta[item.VentaId] = [];
        itemsPorVenta[item.VentaId].push(item);
      }

      const [pagos] = await pool.query(
        `
        SELECT 
          p.IdPago,
          p.VentaId,
          p.Cantidad,
          p.Metodo_Pago,
          p.created_at
        FROM pagos p
        WHERE p.VentaId IN (${placeholders})
        ORDER BY p.created_at ASC
        `,
        ventaIds
      );

      for (const pago of pagos) {
        if (!pagosPorVenta[pago.VentaId]) pagosPorVenta[pago.VentaId] = [];
        pagosPorVenta[pago.VentaId].push(pago);
      }
    }

    // 3. Calcular métricas consolidadas
    let totalComprado = 0;
    let totalAbonado = 0;
    let totalPiezas = 0;
    let apartadosActivos = 0;

    const timeline = [];

    // Evento de registro inicial
    if (cliente.created_at) {
      timeline.push({
        id: `reg-${cliente.IdCliente}`,
        tipo: 'REGISTRO',
        titulo: 'Registro de Clienta',
        descripcion: `Registrada con distribuidora ${cliente.EmpresariaNombre || 'Nice'}`,
        fecha: cliente.created_at,
        folio: null,
        monto: null
      });
    }

    // Procesar cada venta y sus abonos para la línea de tiempo
    for (const v of ventas) {
      const totalNum = Number(v.total) || 0;
      const pagadoNum = Number(v.MontoPagado) || 0;
      const saldoNum = Math.max(0, totalNum - pagadoNum);
      const items = itemsPorVenta[v.IdVenta] || [];
      const piezasVenta = items.reduce((acc, it) => acc + (Number(it.Cantidad) || 0), 0);

      totalComprado += totalNum;
      totalAbonado += pagadoNum;
      totalPiezas += piezasVenta;

      if (v.TipoVenta === 'APARTADO' && saldoNum > 0) {
        apartadosActivos++;
      }

      // Evento de venta / compra
      timeline.push({
        id: `v-${v.IdVenta}`,
        tipo: v.TipoVenta === 'APARTADO' ? 'APARTADO' : 'VENTA',
        titulo: v.TipoVenta === 'APARTADO' ? 'Apartado de Joyería' : 'Compra Directa en POS',
        descripcion:
          items.length > 0
            ? items.map((it) => `${it.Cantidad}x ${it.NombreProducto}`).join(', ')
            : 'Piezas de joyería Nice',
        fecha: v.created_at,
        folio: v.IdVenta,
        monto: totalNum,
        saldoPendiente: saldoNum,
        piezas: piezasVenta,
        items,
        estado: v.Estado
      });

      // Eventos de abonos individuales
      const pagosVenta = pagosPorVenta[v.IdVenta] || [];
      for (const p of pagosVenta) {
        timeline.push({
          id: `p-${p.IdPago}`,
          tipo: 'ABONO',
          titulo: 'Abono Registrado',
          descripcion: `Pago vía ${p.Metodo_Pago || 'Efectivo'} a ticket #${v.IdVenta.substring(0, 8)}`,
          fecha: p.created_at,
          folio: v.IdVenta,
          monto: Number(p.Cantidad),
          metodo: p.Metodo_Pago || 'Efectivo',
          saldoRestante: saldoNum
        });
      }
    }

    // Ordenar línea de tiempo cronológicamente (más reciente arriba)
    timeline.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return {
      cliente,
      metricas: {
        totalComprado,
        totalAbonado,
        saldoPendiente: Math.max(0, totalComprado - totalAbonado),
        totalPiezas,
        totalVentas: ventas.length,
        apartadosActivos
      },
      ventas: ventas.map((v) => ({
        ...v,
        items: itemsPorVenta[v.IdVenta] || [],
        pagos: pagosPorVenta[v.IdVenta] || []
      })),
      timeline
    };
  },

  /**
   * Obtiene el historial global de actividad de todos los clientes.
   */
  async getHistorialGeneral({ empresariaId, limit = 100 } = {}) {
    let sql = `
      SELECT 
        v.IdVenta,
        v.Cliente_Id,
        COALESCE(c.Nombre, 'Venta General / Mostrador') AS ClienteNombre,
        c.Telefono AS ClienteTelefono,
        v.EmpresariaId,
        COALESCE(e.Nombre, 'Distribuidora Nice') AS EmpresariaNombre,
        v.TipoVenta,
        v.Estado,
        v.total,
        v.created_at,
        COALESCE(SUM(p.Cantidad), 0) AS MontoPagado,
        (v.total - COALESCE(SUM(p.Cantidad), 0)) AS SaldoPendiente
      FROM ventas v
      LEFT JOIN clientes c ON v.Cliente_Id = c.IdCliente
      LEFT JOIN empresarias e ON v.EmpresariaId = e.IdEmpresaria
      LEFT JOIN pagos p ON v.IdVenta = p.VentaId
      WHERE 1=1
    `;
    const params = [];

    if (empresariaId) {
      sql += ` AND v.EmpresariaId = ?`;
      params.push(Number(empresariaId));
    }

    sql += ` GROUP BY v.IdVenta ORDER BY v.created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const [ventas] = await pool.query(sql, params);
    return ventas;
  }
};

export default ClienteModel;
