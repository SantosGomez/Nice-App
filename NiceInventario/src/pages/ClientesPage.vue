<template>
  <q-page class="q-pa-md bg-grey-1">
    <!-- Cabecera de Clientes -->
    <div class="page-header animate-fade-in">
      <div class="page-header__title">
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
        class="text-weight-bold shadow-1 touch-target-min"
        @click="abrirModalNuevo"
      />
    </div>

    <!-- Buscador y Filtro por Empresaria (si es Admin) -->
    <q-card flat class="rounded-borders shadow-1 q-mb-sm bg-white">
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

    <!-- Barra de Filtro Alfabético estilo Directorio (A-Z) -->
    <q-card flat class="rounded-borders shadow-1 q-mb-md bg-white directory-bar-card">
      <div class="directory-bar row items-center no-wrap q-py-xs q-px-sm">
        <q-btn
          unelevated
          rounded
          dense
          :class="[
            'directory-all-btn text-weight-bolder q-px-md',
            letraSeleccionada === 'TODOS' ? 'directory-btn--active' : 'bg-grey-2 text-grey-8'
          ]"
          label="Todos"
          @click="seleccionarLetra('TODOS')"
        >
          <q-badge
            floating
            rounded
            :color="letraSeleccionada === 'TODOS' ? 'secondary' : 'grey-5'"
            :text-color="letraSeleccionada === 'TODOS' ? 'primary' : 'white'"
            class="text-weight-bold"
            style="top: -4px; right: -6px;"
          >
            {{ clientesBase.length }}
          </q-badge>
        </q-btn>

        <q-separator vertical spaced class="gt-xs q-mx-xs" />

        <div class="directory-letters-scroll row items-center no-wrap col">
          <button
            v-for="letra in abecedario"
            :key="letra"
            type="button"
            :class="[
              'directory-letter-pill',
              letraSeleccionada === letra ? 'directory-letter-pill--active' : '',
              conteosPorLetra[letra] ? 'directory-letter-pill--has-items' : 'directory-letter-pill--empty'
            ]"
            @click="seleccionarLetra(letra)"
          >
            <span class="letter-char">{{ letra }}</span>
            <span v-if="conteosPorLetra[letra]" class="letter-count">{{ conteosPorLetra[letra] }}</span>
          </button>
        </div>
      </div>
    </q-card>

    <!-- Lista de Clientes en Tarjetas Táctiles -->
    <div v-if="clientesFiltrados.length > 0" class="row q-col-gutter-sm animate-stagger">
      <div
        v-for="c in clientesFiltrados"
        :key="c.IdCliente"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card flat class="rounded-borders shadow-1 bg-white full-height column justify-between touch-card">
          <q-card-section class="q-pa-md">
            <div class="row items-start justify-between no-wrap">
              <div class="row items-center q-gutter-x-sm no-wrap" style="min-width: 0;">
                <q-avatar color="primary" text-color="gold" size="44px" class="text-weight-bold shadow-1 shrink-0">
                  {{ obtenerIniciales(c.Nombre) }}
                </q-avatar>
                <div style="min-width: 0;">
                  <div class="text-subtitle1 text-weight-bold text-primary line-clamp-1">
                    {{ c.Nombre }}
                  </div>
                  <div class="text-caption text-grey-6 row items-center ellipsis">
                    <q-icon name="phone" size="14px" class="q-mr-xs shrink-0" />
                    <span>{{ c.Telefono || 'Sin teléfono' }}</span>
                  </div>
                </div>
              </div>

              <!-- Menú de Acciones -->
              <q-btn flat round dense icon="more_vert" color="grey-7" class="shrink-0">
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

            <!-- Badges: Empresaria Asignada y Estado Local/Offline -->
            <div class="row items-center q-mt-xs q-gutter-x-xs q-gutter-y-xs">
              <q-badge color="amber-2" text-color="dark" class="text-weight-bold">
                <q-icon name="person_pin" size="12px" class="q-mr-xs text-primary" />
                {{ c.EmpresariaNombre || 'Empresaria Nice' }}
              </q-badge>

              <q-badge v-if="c.localOnly === 1" color="grey-3" text-color="grey-8">
                <q-icon name="cloud_queue" size="12px" class="q-mr-xs" />
                Pendiente sync
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

    <!-- Estados Vacíos Contextuales -->
    <div v-else class="empty-state">
      <template v-if="letraSeleccionada !== 'TODOS'">
        <q-icon name="sort_by_alpha" size="56px" color="grey-4" class="empty-state__icon" />
        <div class="empty-state__title">No hay clientas con la letra "{{ letraSeleccionada }}"</div>
        <div class="empty-state__desc q-mb-sm">Puedes elegir otra letra del abecedario o ver todas las clientas</div>
        <q-btn
          unelevated
          rounded
          dense
          color="primary"
          label="Ver todas las clientas"
          class="q-px-md text-weight-bold"
          @click="seleccionarLetra('TODOS')"
        />
      </template>

      <template v-else-if="busqueda">
        <q-icon name="search_off" size="56px" color="grey-4" class="empty-state__icon" />
        <div class="empty-state__title">Sin resultados para "{{ busqueda }}"</div>
        <div class="empty-state__desc q-mb-sm">Intenta con otro término de búsqueda o limpia el filtro</div>
        <q-btn
          outline
          rounded
          dense
          color="primary"
          label="Limpiar búsqueda"
          class="q-px-md text-weight-bold"
          @click="busqueda = ''"
        />
      </template>

      <template v-else>
        <q-icon name="group_off" size="64px" color="grey-4" class="empty-state__icon" />
        <div class="empty-state__title">Sin clientes registradas</div>
        <div class="empty-state__desc q-mb-sm">Comienza agregando clientas para llevar un control de apartados y compras</div>
        <q-btn
          unelevated
          rounded
          color="primary"
          icon="person_add"
          label="Registrar primer cliente"
          class="text-weight-bold"
          @click="abrirModalNuevo"
        />
      </template>
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
            <q-input
              v-model="formCliente.Nombre"
              dense
              outlined
              placeholder="Ej. María Elena González"
              class="q-mt-xs"
              autofocus
            />
          </div>

          <div class="q-mb-sm">
            <label class="text-caption text-weight-bold text-grey-8">Teléfono (WhatsApp)</label>
            <q-input
              v-model="formCliente.Telefono"
              dense
              outlined
              placeholder="Ej. 3312345678"
              class="q-mt-xs"
            />
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
            :loading="guardando"
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
const letraSeleccionada = ref('TODOS');
const mostrarModal = ref(false);
const editando = ref(false);
const guardando = ref(false);

const abecedario = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S',
  'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'
];

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

/**
 * Normaliza la primera letra del nombre eliminando tildes y diacríticos.
 */
function obtenerPrimeraLetra(nombre) {
  if (!nombre || typeof nombre !== 'string') return '#';
  const trimmed = nombre.trim();
  if (trimmed.length === 0) return '#';
  const primera = trimmed.charAt(0).toUpperCase();
  if (primera === 'Ñ') return 'Ñ';
  // Quitar tildes para agrupar A-Z estándar
  const normalizada = primera.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/^[A-Z]$/.test(normalizada)) {
    return normalizada;
  }
  return '#';
}

function seleccionarLetra(letra) {
  if (letraSeleccionada.value === letra) {
    letraSeleccionada.value = 'TODOS';
  } else {
    letraSeleccionada.value = letra;
  }
}

/**
 * Clientes filtrados por empresaria (base antes de letra y búsqueda de texto).
 */
const clientesBase = computed(() => {
  let list = clientes.value;

  if (filtroEmpresaria.value) {
    list = list.filter((c) => Number(c.EmpresariaId) === Number(filtroEmpresaria.value));
  } else if (!authStore.esAdmin) {
    const miEmpId = empresariaStore.empresariaActiva?.IdEmpresaria || authStore.usuario?.IdEmpresaria;
    if (miEmpId) {
      list = list.filter((c) => !c.EmpresariaId || Number(c.EmpresariaId) === Number(miEmpId));
    }
  }

  return list;
});

/**
 * Mapa de conteo de clientes por letra en la lista base actual.
 */
const conteosPorLetra = computed(() => {
  const conteos = {};
  for (const c of clientesBase.value) {
    const l = obtenerPrimeraLetra(c.Nombre);
    conteos[l] = (conteos[l] || 0) + 1;
  }
  return conteos;
});

/**
 * Clientes finales filtrados por letra del abecedario y búsqueda libre.
 */
const clientesFiltrados = computed(() => {
  let list = clientesBase.value;

  // Filtro alfabético
  if (letraSeleccionada.value && letraSeleccionada.value !== 'TODOS') {
    list = list.filter((c) => obtenerPrimeraLetra(c.Nombre) === letraSeleccionada.value);
  }

  // Filtro por búsqueda de texto
  if (busqueda.value && busqueda.value.trim() !== '') {
    const q = busqueda.value.toLowerCase().trim();
    list = list.filter(
      (c) => c.Nombre?.toLowerCase().includes(q) || c.Telefono?.includes(q)
    );
  }

  return list;
});

async function cargarClientes() {
  try {
    if (networkStore.isOnline) {
      try {
        const resp = await api.get('/clientes');
        if (resp.data && resp.data.success && Array.isArray(resp.data.data)) {
          // Guardar clientes del servidor en Dexie sin perder flags locales
          for (const c of resp.data.data) {
            await db.clientes.put({
              ...c,
              localOnly: 0
            });
          }
        }
      } catch (e) {
        console.warn('Fallback a Dexie para clientes:', e.message);
      }
    }

    // Leemos de Dexie todos los clientes (tanto los sincronizados como los locales pendientes)
    const todos = await db.clientes.toArray();
    todos.sort((a, b) => (a.Nombre || '').localeCompare(b.Nombre || '', 'es', { sensitivity: 'base' }));
    clientes.value = todos;
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
    filtroEmpresaria.value ||
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

  const empId = Number(
    f.EmpresariaId ||
    empresariaStore.empresariaActiva?.IdEmpresaria ||
    authStore.usuario?.IdEmpresaria ||
    2
  );
  const nombreEmpresaria =
    empresariaStore.empresarias.find((e) => e.IdEmpresaria === empId)?.Nombre || 'Empresaria Nice';

  guardando.value = true;
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
        try {
          await api.put(`/clientes/${f.IdCliente}`, datosActualizar);
        } catch (apiErr) {
          console.warn('No se pudo actualizar en backend inmediatamente:', apiErr.message);
        }
      }
      $q.notify({ type: 'positive', message: 'Cliente actualizado' });
    } else {
      let nuevoCliente = null;

      // 1. Si hay red, registrar en el backend con await para obtener el IdCliente oficial
      if (networkStore.isOnline) {
        try {
          const resp = await api.post('/clientes', {
            Nombre: f.Nombre.trim(),
            Telefono: f.Telefono ? f.Telefono.trim() : null,
            Nota: f.Nota ? f.Nota.trim() : null,
            EmpresariaId: empId
          });

          if (resp.data && resp.data.success && resp.data.data) {
            nuevoCliente = {
              ...resp.data.data,
              EmpresariaNombre: nombreEmpresaria,
              localOnly: 0
            };
            // Guardar en Dexie con el ID real
            await db.clientes.put(nuevoCliente);
          }
        } catch (apiErr) {
          console.warn('Servidor no disponible, guardando cliente en Dexie:', apiErr.message);
        }
      }

      // 2. Si no se pudo guardar en backend (offline o error), guardar en Dexie como localOnly
      if (!nuevoCliente) {
        const nuevoLocal = {
          EmpresariaId: empId,
          EmpresariaNombre: nombreEmpresaria,
          Nombre: f.Nombre.trim(),
          Telefono: f.Telefono ? f.Telefono.trim() : null,
          Nota: f.Nota ? f.Nota.trim() : null,
          localOnly: 1
        };
        const newId = await db.clientes.add(nuevoLocal);
        nuevoLocal.IdCliente = newId;
        nuevoCliente = nuevoLocal;
      }

      // 3. Garantizar que el cliente nuevo sea visible de inmediato:
      // Limpiar texto de búsqueda que podría ocultarlo
      busqueda.value = '';

      // Si el filtro de empresaria activo no coincide con la del nuevo cliente, quitar el filtro
      if (filtroEmpresaria.value && Number(filtroEmpresaria.value) !== empId) {
        filtroEmpresaria.value = null;
      }

      // Si hay un filtro por letra que no corresponde a la inicial del nuevo cliente, restablecer a TODOS
      const letraNuevo = obtenerPrimeraLetra(nuevoCliente.Nombre);
      if (letraSeleccionada.value !== 'TODOS' && letraSeleccionada.value !== letraNuevo) {
        letraSeleccionada.value = 'TODOS';
      }

      $q.notify({
        type: 'positive',
        icon: 'person_add',
        message: `Cliente "${nuevoCliente.Nombre}" registrado con éxito`
      });
    }

    mostrarModal.value = false;
    await cargarClientes();
  } catch (err) {
    console.error('Error al guardar cliente:', err);
    $q.notify({ type: 'negative', message: 'Error al guardar: ' + err.message });
  } finally {
    guardando.value = false;
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

/* Directorio de Abecedario */
.directory-bar-card {
  border-radius: 14px;
}

.directory-bar {
  gap: 8px;
}

.directory-all-btn {
  font-size: 0.78rem;
  transition: all 0.2s ease;
}

.directory-btn--active {
  background: #0d1b2a !important;
  color: #d4af37 !important;
  box-shadow: 0 2px 6px rgba(13, 27, 42, 0.25);
}

.directory-letters-scroll {
  overflow-x: auto;
  gap: 4px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 2px 0;
}

.directory-letters-scroll::-webkit-scrollbar {
  display: none;
}

.directory-letter-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 4px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.directory-letter-pill:hover {
  background: #f1f5f9;
  color: #0d1b2a;
}

.directory-letter-pill--has-items {
  color: #0d1b2a;
  font-weight: 700;
}

.directory-letter-pill--empty {
  color: #94a3b8;
  opacity: 0.55;
}

.directory-letter-pill--active {
  background: #0d1b2a !important;
  color: #d4af37 !important;
  border-color: rgba(212, 175, 55, 0.5) !important;
  box-shadow: 0 2px 8px rgba(13, 27, 42, 0.25);
  font-weight: 700;
  transform: scale(1.05);
}

.letter-count {
  position: absolute;
  top: -2px;
  right: -2px;
  font-size: 0.6rem;
  line-height: 1;
  background: #d4af37;
  color: #0d1b2a;
  font-weight: 800;
  border-radius: 6px;
  padding: 1px 3px;
}

.directory-letter-pill--active .letter-count {
  background: #ffffff;
  color: #0d1b2a;
}
</style>
