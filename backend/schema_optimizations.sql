-- ================================================================
-- Optimizaciones de Base de Datos para Joyería Nice POS
-- ================================================================

-- 1. Tabla de Kardex / Trazabilidad de Movimientos de Inventario
CREATE TABLE IF NOT EXISTS `inventory_movements` (
  `IdInventario` INT(11) NOT NULL AUTO_INCREMENT,
  `ProductoId` VARCHAR(20) NOT NULL,
  `EmpresariaId` INT(11) NOT NULL,
  `tipo` ENUM('IN_QR', 'MANUAL_IN', 'SALE_OUT', 'ADJUSTMENT') NOT NULL,
  `Quantity` INT(11) NOT NULL,
  `Notas` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdInventario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Índices compuestos para alto rendimiento en consultas frecuentes
-- (Ejecutar si no existen previamente)

-- Aceleración de consultas de stock por empresaria y joya
ALTER TABLE `stock_empresarias` ADD INDEX `idx_stock_emp_prod` (`EmpresariaId`, `ProductoId`);

-- Aceleración de reportes de ventas y filtros de fechas por empresaria
ALTER TABLE `ventas` ADD INDEX `idx_ventas_emp_created` (`EmpresariaId`, `created_at`);

-- Aceleración de búsqueda de clientes por empresaria y nombre
ALTER TABLE `clientes` ADD INDEX `idx_clientes_emp_nombre` (`EmpresariaId`, `Nombre`);

-- Aceleración de consultas de Kardex / historial de movimientos de inventario
ALTER TABLE `inventory_movements` ADD INDEX `idx_movements_emp_prod` (`EmpresariaId`, `ProductoId`, `created_at`);

-- Aceleración de detalle de partidas de venta
ALTER TABLE `sale_items` ADD INDEX `idx_sale_items_venta` (`VentaId`);

-- Aceleración de pagos y abonos de apartados
ALTER TABLE `pagos` ADD INDEX `idx_pagos_venta` (`VentaId`);
