import { defineStore } from 'pinia';
import SyncService from '../services/syncService.js';

export const useNetworkStore = defineStore('network', {
  state: () => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncTime: localStorage.getItem('nice_last_sync') || null,
    pendingSyncCount: 0
  }),

  actions: {
    setOnlineStatus(status) {
      this.isOnline = status;
      if (status) {
        // Al recuperar la red, actualizar contador de pendientes
        this.updatePendingCount();
      }
    },

    async updatePendingCount() {
      this.pendingSyncCount = await SyncService.getPendingCount();
    },

    async syncNow(empresariaId = 1) {
      if (this.isSyncing) return;
      this.isSyncing = true;

      try {
        const result = await SyncService.fullSync(empresariaId);
        this.lastSyncTime = new Date().toISOString();
        await this.updatePendingCount();
        return result;
      } finally {
        this.isSyncing = false;
      }
    }
  }
});

export default useNetworkStore;
