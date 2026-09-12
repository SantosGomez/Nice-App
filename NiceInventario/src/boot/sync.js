import { boot } from 'quasar/wrappers';
import { useNetworkStore } from '../stores/networkStore.js';
import { useEmpresariaStore } from '../stores/empresariaStore.js';
import db from '../db/index.js';

export default boot(async () => {
  const networkStore = useNetworkStore();
  const empresariaStore = useEmpresariaStore();

  // Escuchar cambios de conectividad en el navegador/tablet
  if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
      console.log('📶 [Red] Tablet conectada a internet. Iniciando sincronización automática...');
      networkStore.setOnlineStatus(true);
      try {
        await networkStore.syncNow(empresariaStore.empresariaActiva?.IdEmpresaria || 1);
      } catch (err) {
        console.warn('[Sync] Auto-sincronización falló:', err.message);
      }
    });

    window.addEventListener('offline', () => {
      console.log('📴 [Red] Tablet sin conexión. Modo Offline-First activado en Dexie.js.');
      networkStore.setOnlineStatus(false);
    });

    // Actualizar estado inicial de pendientes
    await networkStore.updatePendingCount();

    // Cargar lista de empresarias si estamos online
    if (networkStore.isOnline) {
      empresariaStore.cargarEmpresarias().catch(() => {});

      // Si la base de datos local no tiene productos aún, descargar catálogo inicial
      const count = await db.productos.count();
      if (count === 0) {
        console.log('📦 [Dexie] Base de datos local vacía. Descargando catálogo inicial...');
        networkStore.syncNow(empresariaStore.empresariaActiva?.IdEmpresaria || 1).catch(() => {});
      }
    }
  }
});
