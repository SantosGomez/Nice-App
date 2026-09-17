import { defineStore } from 'pinia';
import api from '../services/api.js';

export const useEmpresariaStore = defineStore('empresaria', {
  state: () => ({
    // Empresaria vinculada a la sesión autenticada
    empresariaActiva: null,
    // Catálogo de empresarias disponibles para consultas
    empresarias: []
  }),

  getters: {
    descuentoActivo: (state) => Number(state.empresariaActiva?.PorcentajeDescuento || 25.0)
  },

  actions: {
    setEmpresariaActiva(empresaria) {
      if (empresaria) {
        this.empresariaActiva = {
          ...empresaria,
          PorcentajeDescuento: Number(empresaria.PorcentajeDescuento || 25.0)
        };
      } else {
        this.empresariaActiva = null;
      }
    },

    async cargarEmpresarias() {
      try {
        const response = await api.get('/empresarias?estado=Activa');
        if (response.data && response.data.success) {
          this.empresarias = response.data.data;
          // Si el usuario activo está en la lista actualizada, refrescar sus datos locales
          if (this.empresariaActiva?.IdEmpresaria) {
            const encontrada = this.empresarias.find(
              (e) => e.IdEmpresaria === this.empresariaActiva.IdEmpresaria
            );
            if (encontrada) {
              this.setEmpresariaActiva(encontrada);
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ No se pudo actualizar la lista de empresarias desde la API (modo offline):', err.message);
      }
    }
  },

  persist: true
});

export default useEmpresariaStore;
