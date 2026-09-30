import pool from './db.js';

/**
 * Inicializa y verifica las tablas esenciales y crea los índices compuestos
 * recomendados para optimizar el rendimiento y trazabilidad en producción.
 */
export async function initDatabase() {
  try {
    const connection = await pool.getConnection();

    // 1. Tabla inventory_movements (Kardex de trazabilidad de stock)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        IdInventario INT AUTO_INCREMENT PRIMARY KEY,
        ProductoId VARCHAR(20) NOT NULL,
        EmpresariaId INT NOT NULL,
        tipo ENUM('IN_QR', 'MANUAL_IN', 'SALE_OUT', 'ADJUSTMENT') NOT NULL,
        Quantity INT NOT NULL,
        Notas VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // 2. Helper seguro para crear índices si no existen
    const crearIndiceSiNoExiste = async (tabla, nombreIndice, columnas) => {
      try {
        const [indices] = await connection.query(
          `SHOW INDEX FROM ${tabla} WHERE Key_name = ?`,
          [nombreIndice]
        );
        if (indices.length === 0) {
          await connection.query(
            `CREATE INDEX ${nombreIndice} ON ${tabla} (${columnas})`
          );
          console.log(`⚡ [Database] Índice '${nombreIndice}' creado en tabla '${tabla}'`);
        }
      } catch (err) {
        // Ignorar si la tabla aún no existe o no tiene las columnas
      }
    };

    // Crear índices compuestos optimizados
    await crearIndiceSiNoExiste('stock_empresarias', 'idx_stock_emp_prod', 'EmpresariaId, ProductoId');
    await crearIndiceSiNoExiste('ventas', 'idx_ventas_emp_created', 'EmpresariaId, created_at');
    await crearIndiceSiNoExiste('clientes', 'idx_clientes_emp_nombre', 'EmpresariaId, Nombre');
    await crearIndiceSiNoExiste('inventory_movements', 'idx_movements_emp_prod', 'EmpresariaId, ProductoId, created_at');
    await crearIndiceSiNoExiste('sale_items', 'idx_sale_items_venta', 'VentaId');
    await crearIndiceSiNoExiste('pagos', 'idx_pagos_venta', 'VentaId');

    connection.release();
    console.log('✅ [Database] Estructura de base de datos e índices de rendimiento verificados');
  } catch (error) {
    console.warn('⚠️ [Database] Advertencia al verificar estructura de base de datos:', error.message);
  }
}
