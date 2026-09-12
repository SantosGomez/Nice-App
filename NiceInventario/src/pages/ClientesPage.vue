<template>
  <q-page class="q-pa-md bg-grey-1">
    <!-- Cabecera de Clientes -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bolder text-primary brand-font">
          Directorio de Clientes
        </div>
        <div class="text-caption text-grey-7">
          Gestiona tus clientas para ventas directas y sistemas de apartado
        </div>
      </div>

      <q-btn
        unelevated
        rounded
        color="primary"
        icon="person_add"
        label="Nuevo Cliente"
        class="text-weight-bold"
        @click="abrirModalNuevo"
      />
    </div>

    <!-- Buscador -->
    <q-card flat class="rounded-borders shadow-1 q-mb-md bg-white">
      <q-card-section class="q-pa-sm">
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

            <!-- Notas del cliente -->
            <div v-if="c.Nota" class="q-mt-sm q-pa-xs bg-amber-1 rounded-borders text-caption text-grey-8">
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
            class="full-width text-weight-bold text-subtitle1 q-py-sm"
            @click="guardarCliente"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import db from '../db/index.js';
import api from '../services/api.js';
import { usePosStore } from '../stores/posStore.js';
import { useNetworkStore } from '../stores/networkStore.js';

const $q = useQuasar();
const router = useRouter();
const posStore = usePosStore();
const networkStore = useNetworkStore();

const clientes = ref([]);
const busqueda = ref('');
const mostrarModal = ref(false);
const editando = ref(false);

const formCliente = ref({
  IdCliente: null,
  Nombre: '',
  Telefono: '',
  Nota: ''
});

async function cargarClientes() {
  try {
    clientes.value = await db.clientes.toArray();
  } catch (err) {
    console.error('Error cargando clientes:', err);
  }
}

const clientesFiltrados = computed(() => {
  if (!busqueda.value) return clientes.value;
  const q = busqueda.value.toLowerCase();
  return clientes.value.filter(
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
  formCliente.value = { IdCliente: null, Nombre: '', Telefono: '', Nota: '' };
  mostrarModal.value = true;
}

function editarCliente(c) {
  editando.value = true;
  formCliente.value = { ...c };
  mostrarModal.value = true;
}

async function guardarCliente() {
  const f = formCliente.value;
  if (!f.Nombre || f.Nombre.trim() === '') {
    $q.notify({ type: 'warning', message: 'El nombre es obligatorio' });
    return;
  }

  try {
    if (editando.value && f.IdCliente) {
      await db.clientes.update(f.IdCliente, {
        Nombre: f.Nombre.trim(),
        Telefono: f.Telefono ? f.Telefono.trim() : null,
        Nota: f.Nota ? f.Nota.trim() : null
      });

      if (networkStore.isOnline) {
        api.put(`/clientes/${f.IdCliente}`, f).catch(() => {});
      }
      $q.notify({ type: 'positive', message: 'Cliente actualizado' });
    } else {
      const nuevo = {
        Nombre: f.Nombre.trim(),
        Telefono: f.Telefono ? f.Telefono.trim() : null,
        Nota: f.Nota ? f.Nota.trim() : null,
        localOnly: 1
      };
      await db.clientes.add(nuevo);

      if (networkStore.isOnline) {
        api.post('/clientes', nuevo).catch(() => {});
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
