-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 11-09-2026 a las 22:57:58
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `nice_app`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `IdCliente` int(11) NOT NULL,
  `Nombre` varchar(60) NOT NULL,
  `Telefono` varchar(20) DEFAULT NULL,
  `Nota` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`IdCliente`, `Nombre`, `Telefono`, `Nota`) VALUES
(2, 'Valeria Montes', '3318992233', NULL),
(3, 'Valeria Montes', '3318992233', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresarias`
--

CREATE TABLE `empresarias` (
  `IdEmpresaria` int(11) NOT NULL,
  `EIN` varchar(20) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Nombre` varchar(100) NOT NULL,
  `Telefono` varchar(20) DEFAULT NULL,
  `PorcentajeDescuento` decimal(5,2) NOT NULL DEFAULT 25.00 COMMENT 'Ejemplo: 25.00, 35.00, 40.00, 45.00',
  `Estado` enum('Activa','Inactiva') NOT NULL DEFAULT 'Activa',
  `RolId` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empresarias`
--

INSERT INTO `empresarias` (`IdEmpresaria`, `EIN`, `Password`, `Nombre`, `Telefono`, `PorcentajeDescuento`, `Estado`, `RolId`, `created_at`) VALUES
(1, '0', '0', 'Empresaria Principal', NULL, 40.00, 'Activa', 0, '2026-09-11 14:20:07'),
(2, '0', '0', 'Erika Santiago', '8991624008', 45.00, 'Activa', 0, '2026-09-11 19:18:17');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventory_movements`
--

CREATE TABLE `inventory_movements` (
  `IdInventario` int(11) NOT NULL,
  `ProductoId` varchar(20) NOT NULL,
  `EmpresariaId` int(11) NOT NULL DEFAULT 1,
  `tipo` enum('IN_QR','MANUAL_IN','SALE_OUT','ADJUSTMENT') NOT NULL,
  `Quantity` int(11) NOT NULL,
  `Notas` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inventory_movements`
--

INSERT INTO `inventory_movements` (`IdInventario`, `ProductoId`, `EmpresariaId`, `tipo`, `Quantity`, `Notas`, `created_at`) VALUES
(3, 'NICE-COLLAR-01', 1, 'SALE_OUT', 2, 'Venta POS #d5a95efe', '2026-09-11 19:13:24');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `IdPago` int(11) NOT NULL,
  `VentaId` varchar(36) NOT NULL,
  `Cantidad` decimal(10,2) NOT NULL,
  `Metodo_Pago` enum('Efectivo','Tarjeta','Transferencia') NOT NULL DEFAULT 'Efectivo',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`IdPago`, `VentaId`, `Cantidad`, `Metodo_Pago`, `created_at`) VALUES
(2, 'd5a95efe-e9b0-46a9-b511-7ec91600d00d', 1300.00, 'Efectivo', '2026-09-11 19:13:24');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` varchar(20) NOT NULL,
  `sku` varchar(20) NOT NULL,
  `CodigoQr` varchar(100) DEFAULT NULL,
  `Nombre` varchar(70) NOT NULL,
  `Categoria` varchar(20) NOT NULL,
  `Catalogo` varchar(50) NOT NULL,
  `Precio` decimal(10,2) NOT NULL,
  `PrecioCosto` decimal(10,2) NOT NULL DEFAULT 0.00,
  `ImgURL` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `sku`, `CodigoQr`, `Nombre`, `Categoria`, `Catalogo`, `Precio`, `PrecioCosto`, `ImgURL`, `updated_at`) VALUES
('NICE-COLLAR-01', '112233', '112233', 'Gargantilla Bano Oro 18K', 'Collares', 'Nice 2026', 650.00, 390.00, NULL, '2026-09-11 19:08:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `IdRol` int(11) NOT NULL,
  `Rol` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`IdRol`, `Rol`) VALUES
(1, 'SuperAdmin'),
(2, 'Admin'),
(3, 'Empresario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sale_items`
--

CREATE TABLE `sale_items` (
  `Id_sale_items` int(11) NOT NULL,
  `VentaId` varchar(36) NOT NULL,
  `ProductoId` varchar(20) NOT NULL,
  `Precio_unit` decimal(10,2) NOT NULL,
  `Costo_unit` decimal(10,2) NOT NULL DEFAULT 0.00,
  `Cantidad` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sale_items`
--

INSERT INTO `sale_items` (`Id_sale_items`, `VentaId`, `ProductoId`, `Precio_unit`, `Costo_unit`, `Cantidad`) VALUES
(2, 'd5a95efe-e9b0-46a9-b511-7ec91600d00d', 'NICE-COLLAR-01', 650.00, 390.00, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `stock_empresarias`
--

CREATE TABLE `stock_empresarias` (
  `IdStock` int(11) NOT NULL,
  `EmpresariaId` int(11) NOT NULL,
  `ProductoId` varchar(20) NOT NULL,
  `Stock` int(11) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `stock_empresarias`
--

INSERT INTO `stock_empresarias` (`IdStock`, `EmpresariaId`, `ProductoId`, `Stock`, `updated_at`) VALUES
(3, 1, 'NICE-COLLAR-01', 0, '2026-09-11 19:13:24');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `IdVenta` varchar(36) NOT NULL,
  `Cliente_Id` int(11) DEFAULT NULL,
  `EmpresariaId` int(11) NOT NULL DEFAULT 1,
  `TipoVenta` enum('DIRECTA','APARTADO') NOT NULL DEFAULT 'DIRECTA',
  `Estado` enum('COMPLETADA','PENDIENTE','CANCELADA') NOT NULL DEFAULT 'COMPLETADA',
  `total` decimal(10,2) NOT NULL,
  `TotalCosto` decimal(10,2) NOT NULL DEFAULT 0.00,
  `synced` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ventas`
--

INSERT INTO `ventas` (`IdVenta`, `Cliente_Id`, `EmpresariaId`, `TipoVenta`, `Estado`, `total`, `TotalCosto`, `synced`, `created_at`) VALUES
('d5a95efe-e9b0-46a9-b511-7ec91600d00d', NULL, 1, 'DIRECTA', 'COMPLETADA', 1300.00, 780.00, 1, '2026-09-11 19:13:24');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`IdCliente`);

--
-- Indices de la tabla `empresarias`
--
ALTER TABLE `empresarias`
  ADD PRIMARY KEY (`IdEmpresaria`);

--
-- Indices de la tabla `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD PRIMARY KEY (`IdInventario`),
  ADD KEY `idx_inv_producto_id` (`ProductoId`),
  ADD KEY `idx_inv_empresaria` (`EmpresariaId`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`IdPago`),
  ADD KEY `idx_pago_venta_id` (`VentaId`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sku` (`sku`),
  ADD KEY `idx_codigo_qr` (`CodigoQr`),
  ADD KEY `idx_categoria` (`Categoria`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`IdRol`);

--
-- Indices de la tabla `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`Id_sale_items`),
  ADD KEY `idx_venta_id` (`VentaId`),
  ADD KEY `idx_producto_id` (`ProductoId`);

--
-- Indices de la tabla `stock_empresarias`
--
ALTER TABLE `stock_empresarias`
  ADD PRIMARY KEY (`IdStock`),
  ADD UNIQUE KEY `uk_empresaria_producto` (`EmpresariaId`,`ProductoId`),
  ADD KEY `idx_stock_producto` (`ProductoId`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`IdVenta`),
  ADD KEY `fk_ventas_clientes` (`Cliente_Id`),
  ADD KEY `idx_venta_empresaria` (`EmpresariaId`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `IdCliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `empresarias`
--
ALTER TABLE `empresarias`
  MODIFY `IdEmpresaria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `inventory_movements`
--
ALTER TABLE `inventory_movements`
  MODIFY `IdInventario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `IdPago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `IdRol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `Id_sale_items` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `stock_empresarias`
--
ALTER TABLE `stock_empresarias`
  MODIFY `IdStock` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD CONSTRAINT `fk_inventory_empresarias` FOREIGN KEY (`EmpresariaId`) REFERENCES `empresarias` (`IdEmpresaria`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_productos` FOREIGN KEY (`ProductoId`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `fk_pagos_ventas` FOREIGN KEY (`VentaId`) REFERENCES `ventas` (`IdVenta`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `fk_sale_items_productos` FOREIGN KEY (`ProductoId`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sale_items_ventas` FOREIGN KEY (`VentaId`) REFERENCES `ventas` (`IdVenta`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `stock_empresarias`
--
ALTER TABLE `stock_empresarias`
  ADD CONSTRAINT `fk_stock_empresarias_emp` FOREIGN KEY (`EmpresariaId`) REFERENCES `empresarias` (`IdEmpresaria`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_empresarias_prod` FOREIGN KEY (`ProductoId`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `fk_ventas_clientes` FOREIGN KEY (`Cliente_Id`) REFERENCES `clientes` (`IdCliente`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ventas_empresarias` FOREIGN KEY (`EmpresariaId`) REFERENCES `empresarias` (`IdEmpresaria`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
