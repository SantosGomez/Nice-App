const routes = [
  // Ruta pública de autenticación
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue')
  },

  // Rutas principales del sistema
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'inventario', component: () => import('pages/InventarioPage.vue') },
      { path: 'clientes', component: () => import('pages/ClientesPage.vue') },
      { path: 'ventas', component: () => import('pages/VentasPage.vue') },
      { path: 'usuarios', component: () => import('pages/UsuariosPage.vue') },
      { path: 'sync', component: () => import('pages/SyncPage.vue') }
    ]
  },

  // Siempre al final
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
];

export default routes;
