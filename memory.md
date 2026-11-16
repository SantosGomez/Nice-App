# 🧠 MEMORY — Estado y Próximos Pasos · Joyería Nice POS
> Límite: 50 líneas. Actualizado: 2026-11-16 (TiDB Cloud + Trazabilidad Clientes)

## 📌 Proyecto y Base de Datos
POS + Inventario **Offline-First** (Vue 3 + Quasar + Dexie.js) con backend Express 5 conectado a **TiDB Cloud** (MySQL compatible con SSL activo).

## ✅ Hitos y Mejoras Recientes
- **Sprints 1 al 4**: Estabilización de cámara QR, bloqueo de stock, validación de abonos, impresión térmica `@media print`, sync bidireccional, chips dinámicos, paginación reactiva, deduplicación de clientes y badges para productos históricos.
- **TiDB Cloud & Trazabilidad Clientes**:
  - DDL aplicado: `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` en tabla `clientes`.
  - Backend (`clienteModel.js`): soporte de `created_at` en CRUD y corrección de agregación compatible con `only_full_group_by` en `getHistorial`.
  - Frontend (`db/index.js` Dexie v3, `ClientesPage.vue`, `IndexPage.vue`): persistencia de fecha de alta tanto online como offline.

## 📊 Estado de Módulos
| Módulo | Estado |
|---|---|
| Login JWT / Roles / Permisos | ✅ Funcional |
| POS (Venta Directa / Apartado / Ticket) | ✅ Funcional |
| Catálogo / Inventario / Kardex / QR | ✅ Funcional |
| Clientes (Alta, Trazabilidad `created_at`, Kardex) | ✅ Funcional |
| Historial Ventas + Abonos Offline-First | ✅ Funcional |
| Base de Datos TiDB Cloud (SSL) | ✅ Conectada y sincronizada |
| Sync Bidireccional Dexie ↔ TiDB Cloud | ✅ Funcional |

## 🚀 Próximas Mejoras Opcionales
1. Configuración de manifest PWA para instalación en tablet/móvil.
2. Impresión directa vía WebBluetooth para impresoras térmicas ESC/POS.
3. Exportación de cortes de caja en PDF/Excel por período.
