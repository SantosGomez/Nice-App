import { defineStore } from 'pinia';
import api from '../services/api.js';

export const useEmpresariaStore = defineStore('empresaria', {
  state: () => ({
    // Empresaria seleccionada actualmente en la tablet
    empresariaActiva: {
      IdEmpresaria: 1,
      Nombre: 'Empresaria Principal',
      PorcentajeDescuento: 40.0,
      Estado: 'Activa'
    },
    // Catálogo de todas las empresarias disponibles
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
      }
    },

    async cargarEmpresarias() {
      try {
        const response = await api.get('/empresarias?estado=Activa');
        if (response.data && response.data.success) {
          this.empresarias = response.data.data;
          // Si la empresaria activa actual no está en la lista o cambió, actualizar
          const encontrada = this.empresarias.find(
            (e) => e.IdEmpresaria === this.empresariaActiva.IdEmpresaria
          );
          if (encontrada) {
            this.setEmpresariaActiva(encontrada);
          } else if (this.empresarias.length > 0) {
            this.setEmpresariaActiva(this.empresarias[0]);
          }
        }
      } catch (err) {
        console.warn('⚠️ No se pudo actualizar la lista de empresarias desde la API (modo offline):', err.message);
      }
    }
  },

  persist: true // Guardar selección en LocalStorage automáticamente
});

export default useEmpresariaStore;
