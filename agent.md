# 🤖 AGENT — Guía de Trabajo para IA en Joyería Nice POS

> Referencia rápida para cualquier agente/IA que trabaje en este proyecto. Leer antes de tocar cualquier archivo.

---

## 🏗️ Stack Tecnológico

### Frontend (NiceInventario/)

| Capa             | Tecnología                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| Framework UI     | **Vue 3** + **Quasar Framework** (composition API con `<script setup>`)   |
| Estado global    | **Pinia** (con plugin `persist` → guarda en `localStorage`)               |
| BD local offline | **Dexie.js** (IndexedDB) — instancia `NiceAppDB` en `src/db/index.js`     |
| HTTP Client      | **Axios** con interceptores JWT en `src/services/api.js`                  |
| Router           | **Vue Router 4** (hash mode) con guards de roles en `src/router/index.js` |
| Estilos          | Quasar + SCSS personalizado en `src/css/app.scss`                         |

### Backend (backend/)

| Capa          | Tecnología                                                  |
| ------------- | ----------------------------------------------------------- |
| Runtime       | **Node.js** (ESM — `"type": "module"`)                      |
| Framework     | **Express 5**                                               |
| BD remota     | **MySQL / MariaDB** (via `mysql2`)                          |
| Autenticación | **JWT** (jsonwebtoken) + hashes **bcryptjs**                |
| Imágenes      | **Cloudinary** + **Multer** (upload local)                  |
| Seguridad     | **Helmet**, **CORS**, **express-rate-limit**                |
| Deploy        | **Railway** (HOST `0.0.0.0`, PORT desde `process.env.PORT`) |

---

## 📁 Estructura Clave de Archivos

```
NIce app/
├── backend/
│   ├── src/
│   │   ├── server.js          ← Punto de entrada del servidor
│   │   ├── app.js             ← Express app con rutas montadas
│   │   └── config/
│   │       ├── db.js          ← Pool MySQL
│   │       └── initDb.js      ← Inicialización de tablas
│   └── .env                   ← Credenciales (NO subir a git)
└── NiceInventario/
    └── src/
        ├── db/index.js        ← Dexie schema + helpers offline
        ├── services/
        │   ├── api.js         ← Axios client con JWT interceptor
        │   └── syncService.js ← Pull/Push bidireccional
        ├── stores/
        │   ├── authStore.js   ← Sesión, login, logout, perfil
        │   ├── empresariaStore.js ← Empresaria activa + catálogo
        │   ├── networkStore.js ← Online/offline + sync trigger
        │   └── posStore.js    ← Carrito, cálculos, procesarVenta()
        ├── layouts/MainLayout.vue ← Shell: navbar, drawer, footer móvil
        ├── pages/
        │   ├── IndexPage.vue      ← POS (punto de venta)
        │   ├── InventarioPage.vue ← Catálogo + stock
        │   ├── ClientesPage.vue   ← Gestión de clientes
        │   ├── VentasPage.vue     ← Historial + apartados
        │   ├── UsuariosPage.vue   ← Admin: control de usuarios
        │   └── SyncPage.vue       ← Panel de sincronización
        └── router/
            ├── index.js       ← Guard de autenticación + roles
            └── routes.js      ← Mapa de rutas
```

---

## 🔄 Flujo Offline-First (crítico entender esto)

```
Acción usuario → posStore.procesarVenta()
    → db.guardarVentaOffline()  [atómica en Dexie]
        → ventas (synced=0)
        → sale_items
        → pagos
        → stock_empresarias (descuento local)
        → sync_queue
    → networkStore.updatePendingCount()
    → Si online → SyncService.pushToServer()
        → POST /api/sync/push
        → Marca synced=1 en Dexie

Cuando vuelve la red (boot/sync.js, evento 'online'):
    → networkStore.syncNow(empresariaId)
        → SyncService.fullSync()
            → pushToServer() luego pullFromServer()
```

---

## 🛒 Lógica de Roles y Permisos

| RolId | Rol        | Acceso                                  |
| ----- | ---------- | --------------------------------------- |
| 1     | SuperAdmin | Todo (incluye `/usuarios`)              |
| 2     | Admin      | Todo (incluye `/usuarios`)              |
| 3+    | Empresaria | POS, Inventario, Clientes, Ventas, Sync |

- Guard en `router/index.js` → lee `localStorage.getItem('auth')` (pinia-persist)
- `authStore.esAdmin` → RolId 1 ó 2, o Rol `SuperAdmin`/`Admin`
- Rutas con `meta: { roles }` protegidas; sin roles = solo requiere auth

---

## ✅ Buenas Prácticas

- **Siempre guardar en Dexie primero**, luego intentar sincronizar. Nunca depender de red.
- **Usar `db.transaction('rw', [...], async () => {})` en Dexie** para operaciones multi-tabla (atómicas).
- **No mutar `state` de Pinia fuera de `actions`**. Los getters son derivados puros.
- **Verificar `networkStore.isOnline` antes** de llamadas al backend; manejar el error silenciosamente en modo offline.
- **El token JWT va en el header** `Authorization: Bearer <token>` (el interceptor de api.js lo inyecta automáticamente).
- **Pinia `persist: true`** persiste en localStorage. Los stores `auth` y `empresaria` lo usan — no duplicar persistencia manual.
- **IDs de ventas offline** usan `crypto.randomUUID()` (UUID v4). No usar IDs numéricos autoincrement.
- **Stock se descuenta localmente** en `guardarVentaOffline` → no esperar a la sincronización para actualizar la UI.
- **Variables de entorno**: frontend usa `VITE_API_URL`, backend usa `process.env.PORT`, `DB_*`, `JWT_SECRET`, `CLOUDINARY_*`.
- **Quasar components**: preferir `q-dialog`, `q-notify` para feedback al usuario. Usar `useQuasar()` correctamente en setup.

---

## ❌ Qué NO hacer

- ❌ **No subir `.env` ni credenciales** al repositorio.
- ❌ **No hacer fetch/axios directo** sin pasar por `api.js` (perdería el interceptor JWT).
- ❌ **No mutar `ventas.synced`** manualmente fuera de `SyncService.pushToServer()`.
- ❌ **No usar IDs numéricos autoincrement** para ventas creadas offline (colisiones con el servidor).
- ❌ **No eliminar `sync_queue`** manualmente; solo se limpia después de un push exitoso.
- ❌ **No ignorar el scope** de `db.obtenerCatalogoConStock()` — `'mi_stock'` aísla por empresaria.
- ❌ **No agregar rutas sin guard** si requieren autenticación (revisar `router/index.js`).
- ❌ **No usar `window.location.href`** para navegar — usar `useRouter()` de Vue Router.
- ❌ **No hardcodear** la URL del backend; siempre usar `VITE_API_URL` o el default de `api.js`.
- ❌ **No duplicar lógica de descuento** — el porcentaje viene de `empresariaStore.descuentoActivo`.
- ❌ No modificar archivos a menos que sea estrictamente necesario y con autorización.
- ❌ No modificar lo que ya funciona ni refactorizar sin autorización.

---

## 🌐 Endpoints del Backend

| Método | Ruta                         | Descripción                    |
| ------ | ---------------------------- | ------------------------------ |
| GET    | `/api/health`                | Health check                   |
| POST   | `/api/auth/login`            | Login con EIN + Password       |
| POST   | `/api/auth/register`         | Registro de empresaria         |
| GET    | `/api/auth/me`               | Perfil del usuario autenticado |
| CRUD   | `/api/productos`             | Catálogo de productos          |
| CRUD   | `/api/empresarias`           | Gestión de empresarias         |
| CRUD   | `/api/clientes`              | Gestión de clientes            |
| GET    | `/api/inventario/stock/:id`  | Stock por empresaria           |
| POST   | `/api/inventario/movimiento` | Registrar movimiento           |
| POST   | `/api/ventas`                | Crear venta                    |
| GET    | `/api/ventas`                | Listar ventas                  |
| POST   | `/api/ventas/:id/pagos`      | Agregar abono                  |
| GET    | `/api/sync/pull`             | Descargar datos frescos        |
| POST   | `/api/sync/push`             | Subir ventas/clientes offline  |
