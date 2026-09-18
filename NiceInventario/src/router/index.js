import { defineRouter } from '#q-app/wrappers';
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router';
import routes from './routes';

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Guardia de navegación: Protección de rutas con autenticación y roles
  Router.beforeEach((to, from, next) => {
    let isAuthenticated = false;
    let usuario = null;

    try {
      const authRaw = localStorage.getItem('auth');
      if (authRaw) {
        const auth = JSON.parse(authRaw);
        isAuthenticated = Boolean(auth && auth.token && auth.usuario);
        usuario = auth?.usuario || null;
      }
    } catch {
      isAuthenticated = false;
      usuario = null;
    }

    if (to.path !== '/login' && !isAuthenticated) {
      return next('/login');
    }

    if (to.path === '/login' && isAuthenticated) {
      return next('/');
    }

    // Validación de roles requeridos (meta.roles)
    const requiredRoles = to.matched.flatMap((record) => record.meta.roles || []);
    if (requiredRoles.length > 0) {
      const userRole = usuario?.Rol || '';
      const userRoleId = Number(usuario?.RolId);

      const hasPermission =
        userRoleId === 1 || // SuperAdmin siempre tiene acceso completo
        requiredRoles.includes(userRole) ||
        (requiredRoles.includes('Admin') && userRoleId === 2);

      if (!hasPermission) {
        // Redirige al inicio si no cuenta con el rol necesario
        return next('/');
      }
    }

    next();
  });

  return Router;
});
