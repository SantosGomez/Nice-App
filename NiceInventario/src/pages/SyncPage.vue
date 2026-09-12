<template>
  <q-page class="q-pa-md bg-grey-1">
    <!-- Encabezado -->
    <div class="q-mb-md">
      <div class="text-h5 text-weight-bolder text-primary brand-font">
        Sincronización & Modo Offline
      </div>
      <div class="text-caption text-grey-7">
        Gestiona la conexión con el servidor MySQL y revisa el almacenamiento en IndexedDB
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Tarjeta de Estado de Conexión -->
      <div class="col-12 col-md-6">
        <q-card flat class="rounded-borders shadow-1 bg-white full-height">
          <q-card-section class="q-pa-md">
            <div class="text-subtitle1 text-weight-bold text-primary q-mb-sm">
              Estado del Sistema
            </div>

            <!-- Indicador Principal de Conexión -->
            <div class="q-pa-md rounded-borders q-mb-md row items-center justify-between" :class="networkStore.isOnline ? 'bg-positive text-white' : 'bg-warning text-white'">
              <div class="row items-center q-gutter-x-sm">
                <q-icon :name="networkStore.isOnline ? 'cloud_done' : 'cloud_off'" size="32px" />
                <div>
                  <div class="text-subtitle1 text-weight-bolder">
                    {{ networkStore.isOnline ? 'Tablet Conectada al Servidor' : 'Operando en Modo Offline' }}
                  </div>
                  <div class="text-caption">
                    {{ networkStore.isOnline ? 'Las ventas y cambios se sincronizan en la nube' : 'Las transacciones se guardan en IndexedDB localmente' }}
                  </div>
                </div>
              </div>
            </div>

            <q-list separator>
              <q-item class="q-px-none">
                <q-item-section>
                  <q-item-label class="text-weight-bold">Última Sincronización Exitosa</q-item-label>
                  <q-item-label caption>{{ networkStore.lastSyncTime ? formatFecha(networkStore.lastSyncTime) : 'Aún no sincronizado' }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="schedule" color="grey-6" />
                </q-item-section>
              </q-item>

              <q-item class="q-px-none">
                <q-item-section>
                  <q-item-label class="text-weight-bold">Transacciones Pendientes por Subir</q-item-label>
                  <q-item-label caption>{{ networkStore.pendingSyncCount }} ventas locales en espera de internet</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="networkStore.pendingSyncCount > 0 ? 'warning' : 'positive'" class="text-weight-bold">
                    {{ networkStore.pendingSyncCount }} pendientes
                  </q-badge>
                </q-item-section>
              </q-item>

              <q-item class="q-px-none">
                <q-item-section>
                  <q-item-label class="text-weight-bold">Distribuidora Nice Activa</q-item-label>
                  <q-item-label caption>{{ empresariaStore.empresariaActiva?.Nombre }} ({{ empresariaStore.descuentoActivo }}% descuento)</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat dense color="primary" label="Cambiar" @click="empresariaStore.cargarEmpresarias" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <!-- Acciones de Sincronización -->
          <q-card-actions class="q-pa-md row q-gutter-sm">
            <q-btn
              unelevated
              class="col gradient-gold text-primary text-weight-bolder text-subtitle1 q-py-sm"
              icon="sync"
              label="Sincronizar Todo Ahora"
              :loading="networkStore.isSyncing"
              @click="ejecutarSincronizacionTotal"
            />
            <q-btn
              outline
              color="primary"
              icon="cloud_download"
              label="Recargar Catálogo (Pull)"
              :loading="cargandoPull"
              @click="ejecutarPull"
            />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Tarjeta de Diagnóstico de Almacenamiento Local (Dexie) -->
      <div class="col-12 col-md-6">
        <q-card flat class="rounded-borders shadow-1 bg-white full-height column justify-between">
          <q-card-section class="q-pa-md">
            <div class="text-subtitle1 text-weight-bold text-primary q-mb-sm">
              Almacenamiento Local (Dexie.js / IndexedDB)
            </div>

            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-6">
                <div class="bg-grey-2 q-pa-sm rounded-borders text-center">
                  <div class="text-caption text-grey-7">Joyas en Caché</div>
                  <div class="text-h6 text-weight-bolder text-primary">{{ stats.productos }}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="bg-grey-2 q-pa-sm rounded-borders text-center">
                  <div class="text-caption text-grey-7">Registros de Stock</div>
                  <div class="text-h6 text-weight-bolder text-primary">{{ stats.stock }}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="bg-grey-2 q-pa-sm rounded-borders text-center">
                  <div class="text-caption text-grey-7">Clientas Locales</div>
                  <div class="text-h6 text-weight-bolder text-primary">{{ stats.clientes }}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="bg-grey-2 q-pa-sm rounded-borders text-center">
                  <div class="text-caption text-grey-7">Ventas en Dispositivo</div>
                  <div class="text-h6 text-weight-bolder text-primary">{{ stats.ventas }}</div>
                </div>
              </div>
            </div>

            <!-- Bitácora de Sincronización en Vivo -->
            <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-xs">
              Bitácora de Eventos:
            </div>
            <div class="bg-grey-9 text-grey-3 q-pa-sm rounded-borders overflow-auto" style="height: 140px; font-family: monospace; font-size: 0.75rem;">
              <div v-for="(log, idx) in logs" :key="idx" class="q-py-none">
                {{ log }}
              </div>
              <div v-if="logs.length === 0" class="text-grey-6 text-center q-pt-md">
                Sin eventos recientes
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import db from '../db/index.js';
import SyncService from '../services/syncService.js';
import { useNetworkStore } from '../stores/networkStore.js';
import { useEmpresariaStore } from '../stores/empresariaStore.js';

const $q = useQuasar();
const networkStore = useNetworkStore();
const empresariaStore = useEmpresariaStore();

const cargandoPull = ref(false);
const logs = ref([]);
const stats = ref({
  productos: 0,
  stock: 0,
  clientes: 0,
  ventas: 0
});

function agregarLog(mensaje) {
  const hora = new Date().toLocaleTimeString('es-MX');
  logs.value.unshift(`[${hora}] ${mensaje}`);
}

async function actualizarStats() {
  stats.value = {
    productos: await db.productos.count(),
    stock: await db.stock_empresarias.count(),
    clientes: await db.clientes.count(),
    ventas: await db.ventas.count()
  };
}

function formatFecha(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleString('es-MX');
}

async function ejecutarSincronizacionTotal() {
  agregarLog('Iniciando sincronización completa (Push + Pull)...');
  try {
    const empId = empresariaStore.empresariaActiva?.IdEmpresaria || 1;
    const res = await networkStore.syncNow(empId);

    if (res.push && res.push.ventasSincronizadas > 0) {
      agregarLog(`Push: ${res.push.ventasSincronizadas} ventas enviadas al servidor`);
    } else {
      agregarLog('Push: No había transacciones pendientes');
    }

    if (res.pull) {
      agregarLog(`Pull: ${res.pull.productosActualizados} joyas y ${res.pull.clientesActualizados} clientas actualizadas`);
    }

    agregarLog('✅ Sincronización exitosa con servidor MySQL');
    $q.notify({ type: 'positive', message: 'Sincronización completada con éxito' });
    await actualizarStats();
  } catch (err) {
    agregarLog(`❌ Error: ${err.message}`);
    $q.notify({ type: 'warning', message: 'No se pudo conectar al servidor: ' + err.message });
  }
}

async function ejecutarPull() {
  cargandoPull.value = true;
  agregarLog('Descargando catálogo desde el servidor...');
  try {
    const empId = empresariaStore.empresariaActiva?.IdEmpresaria || 1;
    const res = await SyncService.pullFromServer(empId);
    agregarLog(`Pull completado: ${res.productosActualizados} joyas recibidas`);
    $q.notify({ type: 'positive', message: 'Catálogo actualizado' });
    await actualizarStats();
  } catch (err) {
    agregarLog(`❌ Error en Pull: ${err.message}`);
    $q.notify({ type: 'negative', message: 'Error descargando catálogo: ' + err.message });
  } finally {
    cargandoPull.value = false;
  }
}

onMounted(async () => {
  agregarLog('Panel de sincronización iniciado');
  await actualizarStats();
  await networkStore.updatePendingCount();
});
</script>
