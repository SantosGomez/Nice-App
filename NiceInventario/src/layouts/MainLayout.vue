<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-1">
    <!-- Header Principal Elegante Nice -->
    <q-header elevated class="gradient-navy text-white q-py-xs">
      <q-toolbar>
        <q-btn
          dense
          flat
          round
          icon="menu"
          aria-label="Menu"
          size="md"
          @click="toggleLeftDrawer"
        />

        <!-- Marca Nice & Logo -->
        <q-toolbar-title class="row items-center q-gutter-x-sm cursor-pointer" @click="$router.push('/')">
          <q-avatar size="40px" class="bg-gold text-primary text-weight-bolder shadow-2">
            <img src="/nice.png" alt="Logo Nice & Bella">
          </q-avatar>
          <div>
            <div class="text-weight-bold brand-font text-subtitle1 leading-tight text-gold">
              NICE & BELLA
            </div>
            <div class="text-caption text-grey-4 text-weight-light" style="font-size: 0.72rem;">
              POS & Inventario Tablet
            </div>
          </div>
        </q-toolbar-title>

        <q-space />

        <!-- Selector Rápido de Empresaria Activa -->
        <q-btn
          flat
          rounded
          no-caps
          class="q-px-sm q-py-none text-white glass-panel-dark gold-border q-mr-sm"
          @click="mostrarDialogoEmpresarias = true"
        >
          <q-avatar size="26px" color="secondary" text-color="primary" icon="person" class="q-mr-xs" />
          <div class="text-left gt-xs">
            <div class="text-caption text-weight-bold line-clamp-1">
              {{ empresariaStore.empresariaActiva?.Nombre || 'Seleccionar' }}
            </div>
            <div class="text-caption text-gold" style="font-size: 0.68rem;">
              Descuento: {{ empresariaStore.descuentoActivo }}%
            </div>
          </div>
          <q-icon name="arrow_drop_down" class="q-ml-xs" />
        </q-btn>

        <!-- Indicador de Red (Online / Offline) -->
        <q-chip
          dense
          :color="networkStore.isOnline ? 'positive' : 'warning'"
          text-color="white"
          class="text-weight-bold text-caption q-mr-sm shadow-1"
        >
          <q-icon
            :name="networkStore.isOnline ? 'wifi' : 'wifi_off'"
            size="14px"
            class="q-mr-xs"
          />
          <span class="gt-xs">{{ networkStore.isOnline ? 'En Línea' : 'Offline' }}</span>
        </q-chip>

        <!-- Botón de Sincronización Manual -->
        <q-btn
          round
          flat
          dense
          color="secondary"
          :loading="networkStore.isSyncing"
          @click="sincronizarManual"
          class="q-mr-xs"
        >
          <q-icon name="sync" />
          <q-badge
            v-if="networkStore.pendingSyncCount > 0"
            color="negative"
            floating
            rounded
          >
            {{ networkStore.pendingSyncCount }}
          </q-badge>
          <q-tooltip>
            {{ networkStore.pendingSyncCount > 0 ? `${networkStore.pendingSyncCount} pendientes de sincronizar` : 'Sincronizar ahora con la nube' }}
          </q-tooltip>
        </q-btn>

        <!-- Botón de Cerrar Sesión en Header -->
        <q-btn
          round
          flat
          dense
          color="amber-3"
          icon="logout"
          @click="confirmarLogout"
        >
          <q-tooltip>Cerrar Sesión</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Menú Lateral Táctil para Tablet -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      side="left"
      bordered
      :width="270"
      class="bg-white shadow-2 column justify-between"
    >
      <div>
        <div class="q-pa-md gradient-navy text-white text-center q-mb-md">
          <div class="text-h6 text-weight-bold text-gold brand-font">Joyería Nice</div>
          <div class="text-caption text-grey-4">Punto de Venta Offline-First</div>
        </div>

        <q-list padding class="text-grey-9 text-weight-medium">
          <q-item
            clickable
            v-ripple
            to="/"
            exact
            active-class="bg-amber-1 text-primary text-weight-bold"
            class="rounded-borders q-mx-sm q-my-xs"
          >
            <q-item-section avatar>
              <q-icon name="point_of_sale" color="primary" />
            </q-item-section>
            <q-item-section>Punto de Venta (POS)</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            to="/inventario"
            active-class="bg-amber-1 text-primary text-weight-bold"
            class="rounded-borders q-mx-sm q-my-xs"
          >
            <q-item-section avatar>
              <q-icon name="inventory_2" color="primary" />
            </q-item-section>
            <q-item-section>Catálogo e Inventario</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            to="/clientes"
            active-class="bg-amber-1 text-primary text-weight-bold"
            class="rounded-borders q-mx-sm q-my-xs"
          >
            <q-item-section avatar>
              <q-icon name="people" color="primary" />
            </q-item-section>
            <q-item-section>Clientes</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            to="/ventas"
            active-class="bg-amber-1 text-primary text-weight-bold"
            class="rounded-borders q-mx-sm q-my-xs"
          >
            <q-item-section avatar>
              <q-icon name="receipt_long" color="primary" />
            </q-item-section>
            <q-item-section>Historial & Apartados</q-item-section>
          </q-item>

          <!-- Control de Usuarios y Empresarias -->
          <q-item
            clickable
            v-ripple
            to="/usuarios"
            active-class="bg-amber-1 text-primary text-weight-bold"
            class="rounded-borders q-mx-sm q-my-xs"
          >
            <q-item-section avatar>
              <q-icon name="manage_accounts" color="primary" />
            </q-item-section>
            <q-item-section>Control de Usuarios</q-item-section>
          </q-item>

          <q-separator spaced class="q-my-md" />

          <q-item
            clickable
            v-ripple
            to="/sync"
            active-class="bg-amber-1 text-primary text-weight-bold"
            class="rounded-borders q-mx-sm q-my-xs"
          >
            <q-item-section avatar>
              <q-icon name="cloud_sync" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Sincronización</q-item-label>
              <q-item-label caption>
                {{ networkStore.pendingSyncCount > 0 ? `${networkStore.pendingSyncCount} pendientes` : 'Al día' }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Pie de página de estado y usuario en Drawer -->
      <div class="q-pa-md bg-grey-2 border-top">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center q-gutter-x-sm no-wrap">
            <q-avatar size="34px" color="primary" text-color="gold" icon="person" class="shadow-1" />
            <div>
              <div class="text-caption text-weight-bold text-primary line-clamp-1">
                {{ authStore.nombreUsuario }}
              </div>
              <div class="text-caption text-grey-7" style="font-size: 0.68rem;">
                EIN: {{ authStore.einUsuario || '0' }} &bull; {{ authStore.rolUsuario }}
              </div>
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            color="negative"
            icon="logout"
            @click="confirmarLogout"
          >
            <q-tooltip>Cerrar Sesión</q-tooltip>
          </q-btn>
        </div>
      </div>
    </q-drawer>

    <!-- Diálogo para cambiar de Empresaria Activa -->
    <q-dialog v-model="mostrarDialogoEmpresarias">
      <q-card style="min-width: 340px; max-width: 500px; border-radius: 16px;">
        <q-card-section class="gradient-navy text-white row items-center">
          <div class="text-h6 brand-font text-gold">Seleccionar Distribuidora Nice</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="text-caption text-grey-7 q-mb-md">
            Elige la empresaria para calcular el stock local y los márgenes de descuento correspondientes:
          </div>

          <q-list bordered separator class="rounded-borders">
            <q-item
              v-for="emp in empresariaStore.empresarias"
              :key="emp.IdEmpresaria"
              clickable
              v-ripple
              :active="emp.IdEmpresaria === empresariaStore.empresariaActiva?.IdEmpresaria"
              active-class="bg-amber-1 text-primary text-weight-bold"
              @click="seleccionarEmpresaria(emp)"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="gold" icon="person" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.Nombre }}</q-item-label>
                <q-item-label caption>EIN: {{ emp.EIN }} | Tel: {{ emp.Telefono || 'Sin teléfono' }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="secondary" text-color="primary" class="text-weight-bold">
                  {{ emp.PorcentajeDescuento }}% Descuento
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Contenido de las Páginas -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useEmpresariaStore } from '../stores/empresariaStore.js';
import { useNetworkStore } from '../stores/networkStore.js';
import { useAuthStore } from '../stores/authStore.js';

const $q = useQuasar();
const router = useRouter();
const empresariaStore = useEmpresariaStore();
const networkStore = useNetworkStore();
const authStore = useAuthStore();

const leftDrawerOpen = ref(false);
const mostrarDialogoEmpresarias = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function seleccionarEmpresaria(emp) {
  empresariaStore.setEmpresariaActiva(emp);
  mostrarDialogoEmpresarias.value = false;
  $q.notify({
    type: 'positive',
    message: `Empresaria activa: ${emp.Nombre} (${emp.PorcentajeDescuento}% desc.)`,
    position: 'top',
    timeout: 2000
  });

  // Re-sincronizar stock de la nueva empresaria
  if (networkStore.isOnline) {
    networkStore.syncNow(emp.IdEmpresaria);
  }
}

async function sincronizarManual() {
  try {
    await networkStore.syncNow(empresariaStore.empresariaActiva?.IdEmpresaria || 1);
    $q.notify({
      type: 'positive',
      icon: 'cloud_done',
      message: 'Sincronización completada con éxito',
      position: 'top',
      timeout: 2000
    });
  } catch {
    $q.notify({
      type: 'warning',
      icon: 'cloud_off',
      message: 'No se pudo conectar al servidor. Los datos se guardan localmente en la tablet.',
      position: 'top',
      timeout: 3000
    });
  }
}

function confirmarLogout() {
  $q.dialog({
    title: 'Cerrar Sesión',
    message: '¿Estás seguro de que deseas salir del sistema Joyería Nice?',
    cancel: true,
    persistent: true,
    ok: {
      color: 'primary',
      label: 'Cerrar Sesión'
    }
  }).onOk(() => {
    authStore.logout();
    $q.notify({
      type: 'info',
      icon: 'exit_to_app',
      message: 'Has cerrado sesión exitosamente',
      position: 'top'
    });
    router.push('/login');
  });
}

onMounted(() => {
  networkStore.updatePendingCount();
  authStore.cargarPerfil();
  empresariaStore.cargarEmpresarias();
});
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
