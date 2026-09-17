<template>
  <q-page class="q-pa-md bg-grey-1">
    <!-- Cabecera de Clientes -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bolder text-primary brand-font">
          Directorio de Clientes
        </div>
        <div class="text-caption text-grey-7">
          Gestiona tus clientas asignadas a tu cuenta de distribuidora Nice
        </div>
      </div>

      <q-btn
        unelevated
        rounded
        color="primary"
        icon="person_add"
        label="Nuevo Cliente"
        class="text-weight-bold shadow-1"
        @click="abrirModalNuevo"
      />
    </div>

    <!-- Buscador y Filtro por Empresaria (si es Admin) -->
    <q-card flat class="rounded-borders shadow-1 q-mb-md bg-white">
      <q-card-section class="q-pa-sm">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-12" :class="authStore.esAdmin ? 'col-sm-7' : 'col-sm-12'">
            <q-input
              v-model="busqueda"
              dense
              outlined
              rounded
              clearable
              placeholder="Buscar por nombre o número de teléfono..."
              class="bg-grey-1"
            >
              <template #prepend><q-icon name="search" color="primary" /></template>
            </q-input>
          </div>

          <!-- Filtro Empresaria para Administradores -->
          <div v-if="authStore.esAdmin" class="col-12 col-sm-5">
            <q-select
              v-model="filtroEmpresaria"
              dense
              outlined
              rounded
              emit-value
              map-options
              :options="opcionesFiltroEmpresarias"
              label="Distribuidora"
              class="bg-grey-1"
            >
              <template #prepend><q-icon name="storefront" color="primary" /></template>
            </q-select>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Lista de Clientes en Tarjetas Táctiles -->
    <div v-if="clientesFiltrados.length > 0" class="row q-col-gutter-sm">
      <div
        v-for="c in clientesFiltrados"
        :key="c.IdCliente"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card flat class="rounded-borders shadow-1 bg-white full-height column justify-between">
          <q-card-section class="q-pa-md">
            <div class="row items-start justify-between no-wrap">
              <div class="row items-center q-gutter-x-sm no-wrap">
                <q-avatar color="primary" text-color="gold" size="44px" class="text-weight-bold shadow-1">
                  {{ obtenerIniciales(c.Nombre) }}
                </q-avatar>
                <div>
                  <div class="text-subtitle1 text-weight-bold text-primary line-clamp-1">
                    {{ c.Nombre }}
                  </div>
                  <div class="text-caption text-grey-6 row items-center">
                    <q-icon name="phone" size="14px" class="q-mr-xs" />
                    {{ c.Telefono || 'Sin teléfono' }}
                  </div>
                </div>
              </div>

              <!-- Menú de Acciones -->
              <q-btn flat round dense icon="more_vert" color="grey-7">
                <q-menu auto-close>
                  <q-list style="min-width: 140px;">
                    <q-item clickable @click="editarCliente(c)">
                      <q-item-section avatar><q-icon name="edit" size="20px" /></q-item-section>
                      <q-item-section>Editar</q-item-section>
                    </q-item>
                    <q-item clickable class="text-negative" @click="confirmarEliminar(c)">
                      <q-item-section avatar><q-icon name="delete" size="20px" /></q-item-section>
                      <q-item-section>Eliminar</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>

            <!-- Badge de Empresaria Asignada -->
            <div class="row items-center q-mt-xs q-gutter-x-xs">
              <q-badge color="amber-2" text-color="dark" class="text-weight-bold">
                <q-icon name="person_pin" size="12px" class="q-mr-xs text-primary" />
                {{ c.EmpresariaNombre || 'Empresaria Nice' }}
              </q-badge>
            </div>

            <!-- Notas del cliente -->
            <div v-if="c.Nota" class="q-mt-sm q-pa-xs bg-grey-1 rounded-borders text-caption text-grey-8">
              <q-icon name="sticky_note_2" color="warning" class="q-mr-xs" />
              {{ c.Nota }}
            </div>
          </q-card-section>

          <!-- Acciones Rápidas en Footer -->
          <q-card-actions class="q-px-md q-pb-md q-pt-none row q-gutter-xs">
            <q-btn
              v-if="c.Telefono"
              outline
              dense
              color="positive"
              icon="chat"
              label="WhatsApp"
              class="col text-weight-bold"
              @click="abrirWhatsApp(c.Telefono)"
            />
            <q-btn
              unelevated
              dense
              color="primary"
              icon="point_of_sale"
              label="Cobrar en POS"
              class="col text-weight-bold"
              @click="iniciarVentaParaCliente(c)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Estado Vacío -->
    <div v-else class="text-center q-pa-xl text-grey-6">
      <q-icon name="group_off" size="64px" color="grey-4" />
      <div class="text-h6 q-mt-sm">No hay clientes registrados</div>
      <div class="text-caption">Comienza agregando clientas para llevar un control de apartados y compras</div>
    </div>

    <!-- Modal: Nuevo / Editar Cliente -->
    <q-dialog v-model="mostrarModal">
      <q-card style="min-width: 320px; max-width: 480px; border-radius: 16px;">
        <q-card-section class="gradient-navy text-white row items-center">
          <div class="text-h6 brand-font text-gold">
            {{ editando ? 'Editar Cliente' : 'Nuevo Cliente' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="q-mb-sm">
            <label class="text-caption text-weight-bold text-grey-8">Nombre Completo *</label>
            <q-input v-model="formCliente.Nombre" dense outlined placeholder="Ej. María Elena González" class="q-mt-xs" />
          </div>

          <div class="q-mb-sm">
            <label class="text-caption text-weight-bold text-grey-8">Teléfono (WhatsApp)</label>
            <q-input v-model="formCliente.Telefono" dense outlined placeholder="Ej. 3312345678" class="q-mt-xs" />
          </div>

          <!-- Selector de Empresaria Asignada -->
          <div class="q-mb-sm">
            <label class="text-caption text-weight-bold text-grey-8">Distribuidora Asignada *</label>
            <q-select
              v-model="formCliente.EmpresariaId"
              dense
              outlined
              emit-value
              map-options
              :options="opcionesEmpresariasModal"
              class="q-mt-xs"
            />
          </div>

          <div class="q-mb-md">
            <label class="text-caption text-weight-bold text-grey-8">Notas / Preferencias</label>
            <q-input
              v-model="formCliente.Nota"
              dense
              outlined
              type="textarea"
              rows="2"
              placeholder="Ej. Le gustan collares dorados con piedras..."
              class="q-mt-xs"
            />
          </div>

          <q-btn
            unelevated
            color="primary"
            :label="editando ? 'Guardar Cambios' : 'Registrar Cliente'"
            class="full-width text-weight-bold text-subtitle1 q-py-sm shadow-1"
            @click="guardarCliente"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import db from '../db/index.js';
import api from '../services/api.js';
import { usePosStore } from '../stores/posStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { useEmpresariaStore } from '../stores/empresariaStore.js';
import { useNetworkStore } from '../stores/networkStore.js';

const $q = useQuasar();
const router = useRouter();
const posStore = usePosStore();
const authStore = useAuthStore();
const empresariaStore = useEmpresariaStore();
const networkStore = useNetworkStore();

const clientes = ref([]);
const busqueda = ref('');
const filtroEmpresaria = ref(null);
const mostrarModal = ref(false);
const editando = ref(false);

const formCliente = ref({
  IdCliente: null,
  EmpresariaId: null,
  Nombre: '',
  Telefono: '',
  Nota: ''
});

const opcionesFiltroEmpresarias = computed(() => {
  const lista = [{ label: 'Todas las Distribuidoras', value: null }];
  empresariaStore.empresarias.forEach((e) => {
    lista.push({ label: `${e.Nombre} (${e.EIN || 'Sin EIN'})`, value: e.IdEmpresaria });
  });
  return lista;
});

const opcionesEmpresariasModal = computed(() => {
  return empresariaStore.empresarias.map((e) => ({
    label: `${e.Nombre} (${e.EIN || 'Sin EIN'})`,
    value: e.IdEmpresaria
  }));
});

async function cargarClientes() {
  try {
    if (networkStore.isOnline) {
      try {
        const resp = await api.get('/clientes');
        if (resp.data && resp.data.success && Array.isArray(resp.data.data)) {
          clientes.value = resp.data.data;
          await db.clientes.bulkPut(resp.data.data);
          return;
        }
      } catch (e) {
        console.warn('Fallback a Dexie para clientes:', e.message);
      }
    }

    clientes.value = await db.clientes.toArray();
  } catch (err) {
    console.error('Error cargando clientes:', err);
  }
}

watch(
  () => empresariaStore.empresariaActiva?.IdEmpresaria,
  () => {
    cargarClientes();
  }
);

const clientesFiltrados = computed(() => {
  let list = clientes.value;

  if (filtroEmpresaria.value) {
    list = list.filter((c) => Number(c.EmpresariaId) === Number(filtroEmpresaria.value));
  } else if (!authStore.esAdmin) {
    const miEmpId = empresariaStore.empresariaActiva?.IdEmpresaria || authStore.usuario?.IdEmpresaria;
    if (miEmpId) {
      list = list.filter((c) => !c.EmpresariaId || Number(c.EmpresariaId) === Number(miEmpId));
    }
  }

  if (!busqueda.value) return list;
  const q = busqueda.value.toLowerCase();
  return list.filter(
    (c) => c.Nombre?.toLowerCase().includes(q) || c.Telefono?.includes(q)
  );
});

function obtenerIniciales(nombre) {
  if (!nombre) return 'C';
  const partes = nombre.trim().split(' ');
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return nombre.substring(0, 2).toUpperCase();
}

function abrirModalNuevo() {
  editando.value = false;
  const defaultEmpId =
    empresariaStore.empresariaActiva?.IdEmpresaria ||
    authStore.usuario?.IdEmpresaria ||
    (empresariaStore.empresarias[0]?.IdEmpresaria ?? 2);

  formCliente.value = {
    IdCliente: null,
    EmpresariaId: defaultEmpId,
    Nombre: '',
    Telefono: '',
    Nota: ''
  };
  mostrarModal.value = true;
}

function editarCliente(c) {
  editando.value = true;
  formCliente.value = {
    IdCliente: c.IdCliente,
    EmpresariaId: c.EmpresariaId || empresariaStore.empresariaActiva?.IdEmpresaria || 2,
    Nombre: c.Nombre,
    Telefono: c.Telefono || '',
    Nota: c.Nota || ''
  };
  mostrarModal.value = true;
}

async function guardarCliente() {
  const f = formCliente.value;
  if (!f.Nombre || f.Nombre.trim() === '') {
    $q.notify({ type: 'warning', message: 'El nombre es obligatorio' });
    return;
  }

  const empId = Number(f.EmpresariaId || empresariaStore.empresariaActiva?.IdEmpresaria || authStore.usuario?.IdEmpresaria || 2);
  const nombreEmpresaria = empresariaStore.empresarias.find((e) => e.IdEmpresaria === empId)?.Nombre || 'Empresaria Nice';

  try {
    if (editando.value && f.IdCliente) {
      const datosActualizar = {
        Nombre: f.Nombre.trim(),
        Telefono: f.Telefono ? f.Telefono.trim() : null,
        Nota: f.Nota ? f.Nota.trim() : null,
        EmpresariaId: empId,
        EmpresariaNombre: nombreEmpresaria
      };

      await db.clientes.update(f.IdCliente, datosActualizar);

      if (networkStore.isOnline) {
        api.put(`/clientes/${f.IdCliente}`, datosActualizar).catch(() => {});
      }
      $q.notify({ type: 'positive', message: 'Cliente actualizado' });
    } else {
      const nuevo = {
        EmpresariaId: empId,
        EmpresariaNombre: nombreEmpresaria,
        Nombre: f.Nombre.trim(),
        Telefono: f.Telefono ? f.Telefono.trim() : null,
        Nota: f.Nota ? f.Nota.trim() : null,
        localOnly: 1
      };
      const newId = await db.clientes.add(nuevo);

      if (networkStore.isOnline) {
        api.post('/clientes', { ...nuevo, IdCliente: newId }).catch(() => {});
      }
      $q.notify({ type: 'positive', message: 'Cliente registrado' });
    }

    mostrarModal.value = false;
    await cargarClientes();
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Error al guardar: ' + err.message });
  }
}

function confirmarEliminar(c) {
  $q.dialog({
    title: 'Eliminar Cliente',
    message: `¿Seguro que deseas eliminar a "${c.Nombre}"?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await db.clientes.delete(c.IdCliente);
      if (networkStore.isOnline) {
        api.delete(`/clientes/${c.IdCliente}`).catch(() => {});
      }
      $q.notify({ type: 'positive', message: 'Cliente eliminado' });
      await cargarClientes();
    } catch (err) {
      $q.notify({ type: 'negative', message: 'Error al eliminar cliente: ' + err.message });
    }
  });
}

function abrirWhatsApp(tel) {
  const numeroLimpio = tel.replace(/\D/g, '');
  window.open(`https://wa.me/52${numeroLimpio}`, '_blank');
}

function iniciarVentaParaCliente(c) {
  posStore.clienteSeleccionado = c;
  $q.notify({ type: 'positive', message: `Cliente "${c.Nombre}" asignado para cobro` });
  router.push('/');
}

onMounted(() => {
  empresariaStore.cargarEmpresarias();
  cargarClientes();
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
