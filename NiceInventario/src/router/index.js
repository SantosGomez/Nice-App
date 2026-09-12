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

  // Guardia de navegación: Protección de rutas con autenticación
  Router.beforeEach((to, from, next) => {
    let isAuthenticated = false;
    try {
      const authRaw = localStorage.getItem('auth');
      if (authRaw) {
        const auth = JSON.parse(authRaw);
        isAuthenticated = Boolean(auth && auth.token && auth.usuario);
      }
    } catch {
      isAuthenticated = false;
    }

    if (to.path !== '/login' && !isAuthenticated) {
      next('/login');
    } else if (to.path === '/login' && isAuthenticated) {
      next('/');
    } else {
      next();
    }
  });

  return Router;
});
