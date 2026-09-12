import pool from '../config/db.js';
import { randomUUID } from 'crypto';
import { InventarioModel } from './inventarioModel.js';

/**
 * Modelo de Acceso a Datos (DAO) para Ventas, Renglones (sale_items) y Pagos.
 * Maneja transacciones ACID para asegurar la integridad entre venta, pagos y stock.
 */
export const VentaModel = {
  /**
   * Crea una venta completa de forma transaccional.
   * Si la venta proviene de la tablet offline, puede traer ya su propio IdVenta (UUID).
   */
  async crearVentaTransaccional({
    IdVenta,
    Cliente_Id = null,
    EmpresariaId = 1,
    TipoVenta = 'DIRECTA',
    Estado = 'COMPLETADA',
    total,
    TotalCosto = 0.0,
    items = [],
    pagos = [],
    synced = 1
  }) {
    const ventaId = IdVenta || randomUUID();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Idempotencia: Verificar si ya existe esta venta (evita duplicar en sincronización offline)
      const [existing] = await connection.query(
        'SELECT IdVenta FROM ventas WHERE IdVenta = ?',
        [ventaId]
      );
      if (existing.length > 0) {
        await connection.rollback();
        connection.release();
        return {
          IdVenta: ventaId,
          alreadyExisted: true,
          message: 'La venta ya se encontraba registrada previamente'
        };
      }

      // 2. Insertar cabecera de venta
      const sqlVenta = `
        INSERT INTO ventas (
          IdVenta, Cliente_Id, EmpresariaId, TipoVenta, Estado, total, TotalCosto, synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await connection.query(sqlVenta, [
        ventaId,
        Cliente_Id || null,
        EmpresariaId,
        TipoVenta,
        Estado,
        total,
        TotalCosto,
        synced
      ]);

      // 3. Insertar partidas de venta (sale_items) y descontar stock
      for (const item of items) {
        const { ProductoId, Precio_unit, Costo_unit = 0.0, Cantidad } = item;

        // Insertar renglón de venta
        const sqlItem = `
          INSERT INTO sale_items (VentaId, ProductoId, Precio_unit, Costo_unit, Cantidad)
          VALUES (?, ?, ?, ?, ?)
        `;
        await connection.query(sqlItem, [
          ventaId,
          ProductoId,
          Precio_unit,
          Costo_unit,
          Cantidad
        ]);

        // Registrar salida en inventario y descontar de stock_empresarias
        await InventarioModel.registrarMovimiento(
          {
            ProductoId,
            EmpresariaId,
            tipo: 'SALE_OUT',
            Quantity: Cantidad,
            Notas: `Venta POS #${ventaId.substring(0, 8)}`
          },
          connection
        );
      }

      // 4. Insertar pagos o abonos iniciales
      const pagosList = Array.isArray(pagos) ? pagos : (pagos ? [pagos] : []);
      for (const pago of pagosList) {
        if (pago && Number(pago.Cantidad) > 0) {
          const sqlPago = `
            INSERT INTO pagos (VentaId, Cantidad, Metodo_Pago)
            VALUES (?, ?, ?)
          `;
          await connection.query(sqlPago, [
            ventaId,
            Number(pago.Cantidad),
            pago.Metodo_Pago || 'Efectivo'
          ]);
        }
      }

      await connection.commit();
      connection.release();

      return {
        success: true,
        IdVenta: ventaId,
        Cliente_Id,
        EmpresariaId,
        TipoVenta,
        Estado,
        total,
        itemCount: items.length
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  },

  /**
   * Obtiene lista de ventas con filtros de empresaria, cliente, estado y fecha.
   */
  async getAll({
    empresariaId,
    clienteId,
    estado,
    tipoVenta,
    fechaInicio,
    fechaFin,
    limit = 50,
    offset = 0
  } = {}) {
    let sql = `
      SELECT 
        v.IdVenta,
        v.Cliente_Id,
        c.Nombre AS ClienteNombre,
        c.Telefono AS ClienteTelefono,
        v.EmpresariaId,
        e.Nombre AS EmpresariaNombre,
        v.TipoVenta,
        v.Estado,
        v.total,
        v.TotalCosto,
        v.synced,
        v.created_at,
        COALESCE(SUM(p.Cantidad), 0) AS TotalPagado,
        (v.total - COALESCE(SUM(p.Cantidad), 0)) AS SaldoPendiente
      FROM ventas v
      LEFT JOIN clientes c ON v.Cliente_Id = c.IdCliente
      LEFT JOIN empresarias e ON v.EmpresariaId = e.IdEmpresaria
      LEFT JOIN pagos p ON v.IdVenta = p.VentaId
    `;

    const params = [];
    const conditions = [];

    if (empresariaId) {
      conditions.push('v.EmpresariaId = ?');
      params.push(empresariaId);
    }

    if (clienteId) {
      conditions.push('v.Cliente_Id = ?');
      params.push(clienteId);
    }

    if (estado) {
      conditions.push('v.Estado = ?');
      params.push(estado);
    }

    if (tipoVenta) {
      conditions.push('v.TipoVenta = ?');
      params.push(tipoVenta);
    }

    if (fechaInicio) {
      conditions.push('v.created_at >= ?');
      params.push(fechaInicio);
    }

    if (fechaFin) {
      conditions.push('v.created_at <= ?');
      params.push(fechaFin);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += `
      GROUP BY v.IdVenta
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Obtiene el detalle completo de una venta con sus partidas y pagos.
   */
  async getById(idVenta) {
    // 1. Cabecera
    const sqlVenta = `
      SELECT 
        v.IdVenta,
        v.Cliente_Id,
        c.Nombre AS ClienteNombre,
        c.Telefono AS ClienteTelefono,
        v.EmpresariaId,
        e.Nombre AS EmpresariaNombre,
        v.TipoVenta,
        v.Estado,
        v.total,
        v.TotalCosto,
        v.synced,
        v.created_at
      FROM ventas v
      LEFT JOIN clientes c ON v.Cliente_Id = c.IdCliente
      LEFT JOIN empresarias e ON v.EmpresariaId = e.IdEmpresaria
      WHERE v.IdVenta = ?
    `;
    const [ventas] = await pool.query(sqlVenta, [idVenta]);
    if (ventas.length === 0) return null;

    const venta = ventas[0];

    // 2. Partidas
    const sqlItems = `
      SELECT 
        si.Id_sale_items,
        si.ProductoId,
        p.Nombre AS ProductoNombre,
        p.sku,
        p.CodigoQr,
        p.Categoria,
        p.ImgURL,
        si.Precio_unit,
        si.Costo_unit,
        si.Cantidad,
        (si.Precio_unit * si.Cantidad) AS Subtotal
      FROM sale_items si
      INNER JOIN productos p ON si.ProductoId = p.id
      WHERE si.VentaId = ?
    `;
    const [items] = await pool.query(sqlItems, [idVenta]);

    // 3. Pagos
    const sqlPagos = `
      SELECT 
        IdPago,
        Cantidad,
        Metodo_Pago,
        created_at
      FROM pagos
      WHERE VentaId = ?
      ORDER BY created_at ASC
    `;
    const [pagos] = await pool.query(sqlPagos, [idVenta]);

    const totalPagado = pagos.reduce((acc, curr) => acc + Number(curr.Cantidad), 0);
    const saldoPendiente = Math.max(0, Number(venta.total) - totalPagado);

    return {
      ...venta,
      TotalPagado: totalPagado,
      SaldoPendiente: saldoPendiente,
      items,
      pagos
    };
  },

  /**
   * Agrega un pago/abono a una venta (ej. para liquidar un apartado).
   * Si el total de pagos cubre el importe de la venta, actualiza el estado a COMPLETADA.
   */
  async agregarPago(idVenta, { Cantidad, Metodo_Pago = 'Efectivo' }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar que la venta exista
      const [ventas] = await connection.query(
        'SELECT IdVenta, total, Estado FROM ventas WHERE IdVenta = ?',
        [idVenta]
      );
      if (ventas.length === 0) {
        await connection.rollback();
        connection.release();
        return null;
      }

      const venta = ventas[0];

      // Registrar pago
      const sqlPago = `
        INSERT INTO pagos (VentaId, Cantidad, Metodo_Pago)
        VALUES (?, ?, ?)
      `;
      const [pagoResult] = await connection.query(sqlPago, [
        idVenta,
        Number(Cantidad),
        Metodo_Pago
      ]);

      // Calcular suma total pagada
      const [sumRows] = await connection.query(
        'SELECT COALESCE(SUM(Cantidad), 0) AS TotalPagado FROM pagos WHERE VentaId = ?',
        [idVenta]
      );
      const nuevoTotalPagado = Number(sumRows[0].TotalPagado);

      // Si ya cubrió o superó el total y estaba PENDIENTE, marcar como COMPLETADA
      let nuevoEstado = venta.Estado;
      if (nuevoTotalPagado >= Number(venta.total) && venta.Estado === 'PENDIENTE') {
        await connection.query(
          'UPDATE ventas SET Estado = "COMPLETADA" WHERE IdVenta = ?',
          [idVenta]
        );
        nuevoEstado = 'COMPLETADA';
      }

      await connection.commit();
      connection.release();

      return {
        IdPago: pagoResult.insertId,
        VentaId: idVenta,
        Cantidad: Number(Cantidad),
        Metodo_Pago,
        TotalPagado: nuevoTotalPagado,
        SaldoPendiente: Math.max(0, Number(venta.total) - nuevoTotalPagado),
        Estado: nuevoEstado
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  },

  /**
   * Procesa un lote de ventas recibidas durante la sincronización offline.
   */
  async procesarLoteOffline(ventasBatch = []) {
    const resultados = {
      procesadas: 0,
      yaExistian: 0,
      errores: []
    };

    for (const venta of ventasBatch) {
      try {
        const res = await this.crearVentaTransaccional({
          ...venta,
          synced: 1
        });
        if (res.alreadyExisted) {
          resultados.yaExistian++;
        } else {
          resultados.procesadas++;
        }
      } catch (err) {
        resultados.errores.push({
          IdVenta: venta.IdVenta,
          error: err.message
        });
      }
    }

    return resultados;
  }
};
