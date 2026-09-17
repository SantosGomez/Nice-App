import { defineStore } from 'pinia';
import api from '../services/api.js';
import { useEmpresariaStore } from './empresariaStore.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    usuario: null
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.usuario),
    esAdmin: (state) =>
      state.usuario?.RolId === 1 ||
      state.usuario?.RolId === 2 ||
      state.usuario?.Rol === 'SuperAdmin' ||
      state.usuario?.Rol === 'Admin',
    esSuperAdmin: (state) =>
      state.usuario?.RolId === 1 || state.usuario?.Rol === 'SuperAdmin',
    nombreUsuario: (state) => state.usuario?.Nombre || 'Usuario Nice',
    einUsuario: (state) => state.usuario?.EIN || '',
    descuentoUsuario: (state) => Number(state.usuario?.PorcentajeDescuento || 25.0),
    rolUsuario: (state) => state.usuario?.Rol || 'Empresario'
  },

  actions: {
    /**
     * Inicia sesión con EIN y contraseña.
     */
    async login({ EIN, Password }) {
      const response = await api.post('/auth/login', {
        EIN: String(EIN).trim(),
        Password
      });

      if (response.data && response.data.success) {
        this.token = response.data.token;
        this.usuario = response.data.user;

        // Sincronizar con la empresaria activa en el POS
        const empresariaStore = useEmpresariaStore();
        empresariaStore.setEmpresariaActiva(this.usuario);

        return response.data;
      }
      throw new Error(response.data?.message || 'Error al iniciar sesión');
    },

    /**
     * Registra una nueva empresaria/usuario en el sistema.
     */
    async register(datos) {
      const response = await api.post('/auth/register', datos);

      if (response.data && response.data.success) {
        this.token = response.data.token;
        this.usuario = response.data.user;

        // Sincronizar con la empresaria activa en el POS
        const empresariaStore = useEmpresariaStore();
        empresariaStore.setEmpresariaActiva(this.usuario);

        return response.data;
      }
      throw new Error(response.data?.message || 'Error al registrar el usuario');
    },

    /**
     * Cierra la sesión activa.
     */
    logout() {
      this.token = null;
      this.usuario = null;
      const empresariaStore = useEmpresariaStore();
      empresariaStore.setEmpresariaActiva(null);
    },

    /**
     * Actualiza los datos del usuario en la sesión local.
     */
    setUsuario(nuevoUsuario) {
      if (nuevoUsuario) {
        this.usuario = {
          ...this.usuario,
          ...nuevoUsuario,
          PorcentajeDescuento: Number(nuevoUsuario.PorcentajeDescuento || 25.0)
        };
        const empresariaStore = useEmpresariaStore();
        empresariaStore.setEmpresariaActiva(this.usuario);
      }
    },

    /**
     * Consulta el perfil actualizado desde el backend.
     */
    async cargarPerfil() {
      if (!this.token) return;
      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.success) {
          this.setUsuario(response.data.user);
        }
      } catch (err) {
        console.warn('No se pudo actualizar el perfil desde el servidor:', err.message);
      }
    }
  },

  persist: true
});

export default useAuthStore;
