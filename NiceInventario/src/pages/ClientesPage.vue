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

      <div class="page-header__actions">
        <!-- Historial General (Kardex global) -->
        <q-btn
          outline
          rounded
          color="primary"
          icon="history"
          label="Historial General"
          class="text-weight-bold shadow-1 touch-target-min gt-xs bg-white"
          @click="abrirHistorialGeneral"
        >
          <q-tooltip>Ver registro global de compras y abonos de clientes</q-tooltip>
        </q-btn>

        <!-- Botón Historial para móvil (icono compacto) -->
        <q-btn
          flat
          round
          dense
          color="primary"
          icon="history"
          class="lt-sm shadow-1 bg-white"
          @click="abrirHistorialGeneral"
        >
          <q-tooltip>Historial general</q-tooltip>
        </q-btn>

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
                  <q-list style="min-width: 160px;">
                    <q-item clickable @click="abrirKardexCliente(c)">
                      <q-item-section avatar><q-icon name="history" color="primary" size="20px" /></q-item-section>
                      <q-item-section class="text-weight-medium">Ver Kardex</q-item-section>
                    </q-item>
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
          <q-card-actions class="q-px-md q-pb-md q-pt-none row q-gutter-xs items-center">
            <!-- Botón de acceso directo a Kardex del cliente -->
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="history"
              class="shrink-0 bg-grey-1"
              @click="abrirKardexCliente(c)"
            >
              <q-tooltip>Historial / Kardex de la clienta</q-tooltip>
            </q-btn>

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

    <!-- Diálogo: Kardex / Historial del Cliente -->
    <q-dialog v-model="mostrarModalKardex" :maximized="$q.screen.xs">
      <q-card style="width: 100%; max-width: 820px; border-radius: 16px;" class="column overflow-hidden">
        <!-- Cabecera Navy con Acentos Dorados -->
        <q-card-section class="gradient-navy text-white row items-center justify-between q-py-sm shrink-0">
          <div class="row items-center q-gutter-x-sm no-wrap" style="min-width: 0;">
            <q-avatar size="42px" color="secondary" text-color="primary" icon="history" class="shadow-2 shrink-0" />
            <div style="min-width: 0;">
              <div class="text-subtitle1 text-weight-bold text-gold brand-font ellipsis">
                {{ kardexClienteSeleccionado ? `Kardex: ${kardexClienteSeleccionado.Nombre}` : 'Historial General de Clientes' }}
              </div>
              <div v-if="kardexClienteSeleccionado" class="text-caption text-grey-3 ellipsis">
                {{ kardexClienteSeleccionado.Telefono || 'Sin teléfono' }} • Distribuidora: {{ kardexClienteSeleccionado.EmpresariaNombre || 'Nice' }}
              </div>
              <div v-else class="text-caption text-grey-3">
                Registro cronológico de compras, apartados y abonos
              </div>
            </div>
          </div>

          <div class="row items-center q-gutter-x-xs no-wrap shrink-0">
            <!-- Compartir WhatsApp estado de cuenta -->
            <q-btn
              v-if="kardexClienteSeleccionado && kardexClienteSeleccionado.Telefono"
              flat
              round
              dense
              color="positive"
              icon="chat"
              class="bg-white-10"
              @click="compartirEstadoCuentaWhatsApp(kardexClienteSeleccionado, kardexMetricas)"
            >
              <q-tooltip>Compartir estado de cuenta por WhatsApp</q-tooltip>
            </q-btn>

            <q-btn
              flat
              round
              dense
              icon="refresh"
              color="amber-4"
              :loading="cargandoKardex"
              @click="recargarKardexActual"
            >
              <q-tooltip>Actualizar historial</q-tooltip>
            </q-btn>

            <q-btn icon="close" flat round dense v-close-popup />
          </div>
        </q-card-section>

        <!-- Métricas Rápidas Comerciales (si es cliente individual) -->
        <q-card-section v-if="kardexClienteSeleccionado" class="bg-grey-1 q-pa-sm border-bottom shrink-0">
          <div class="row q-col-gutter-xs">
            <div class="col-4">
              <div class="stat-card q-pa-xs">
                <div class="stat-card__label">Total Comprado</div>
                <div class="stat-card__value text-primary" style="font-size: 1.05rem;">
                  ${{ formatPrecio(kardexMetricas.totalComprado) }}
                </div>
              </div>
            </div>
            <div class="col-4">
              <div class="stat-card q-pa-xs">
                <div class="stat-card__label">Total Abonado</div>
                <div class="stat-card__value text-positive" style="font-size: 1.05rem;">
                  ${{ formatPrecio(kardexMetricas.totalAbonado) }}
                </div>
              </div>
            </div>
            <div class="col-4">
              <div class="stat-card q-pa-xs">
                <div class="stat-card__label">Saldo Pendiente</div>
                <div
                  class="stat-card__value"
                  :class="kardexMetricas.saldoPendiente > 0 ? 'text-warning' : 'text-grey-6'"
                  style="font-size: 1.05rem;"
                >
                  ${{ formatPrecio(kardexMetricas.saldoPendiente) }}
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <!-- Pestañas de Filtro del Kardex -->
        <q-card-section class="q-py-xs bg-grey-2 border-bottom shrink-0">
          <q-tabs
            v-model="filtroTipoTimeline"
            dense
            no-caps
            align="left"
            active-color="primary"
            indicator-color="secondary"
            class="text-grey-7"
          >
            <q-tab name="TODOS" label="Todos" icon="list" />
            <q-tab name="VENTAS" label="Compras / Apartados" icon="shopping_bag" />
            <q-tab name="ABONOS" label="Abonos Recibidos" icon="payments" />
          </q-tabs>
        </q-card-section>

        <!-- Lista del Timeline / Historial -->
        <q-card-section class="col q-pa-sm overflow-auto" style="max-height: 55vh;">
          <div v-if="cargandoKardex" class="q-pa-lg text-center">
            <q-spinner-dots color="primary" size="40px" />
            <div class="text-caption text-grey-6 q-mt-sm">Cargando trazabilidad comercial...</div>
          </div>

          <div v-else-if="timelineFiltrado.length === 0" class="empty-state q-pa-lg">
            <q-icon name="history_toggle_off" size="56px" color="grey-4" class="empty-state__icon" />
            <div class="empty-state__title">Sin movimientos registrados</div>
            <div class="empty-state__desc">
              {{ kardexClienteSeleccionado ? 'Esta clienta aún no tiene compras o abonos registrados.' : 'No se encontraron registros de ventas ni abonos.' }}
            </div>
          </div>

          <q-list v-else separator class="rounded-borders bg-white shadow-1">
            <q-item
              v-for="item in timelineFiltrado"
              :key="item.id"
              class="q-py-sm"
            >
              <!-- Icono y color según el tipo de evento -->
              <q-item-section avatar>
                <q-avatar
                  size="38px"
                  :color="getColorEvento(item.tipo)"
                  text-color="white"
                  :icon="getIconoEvento(item.tipo)"
                  class="shadow-1"
                />
              </q-item-section>

              <!-- Información del evento -->
              <q-item-section>
                <div class="row items-center justify-between no-wrap">
                  <div class="text-weight-bold text-primary">
                    {{ item.titulo }}
                  </div>
                  <div
                    v-if="item.monto !== null"
                    class="text-weight-bolder text-subtitle2"
                    :class="getColorMonto(item.tipo)"
                  >
                    {{ getSignoMonto(item.tipo) }}${{ formatPrecio(item.monto) }}
                  </div>
                </div>

                <div class="text-caption text-grey-8 q-mt-xs">
                  <span v-if="!kardexClienteSeleccionado && item.clienteNombre" class="text-weight-bold text-primary">
                    {{ item.clienteNombre }} &bull;
                  </span>
                  {{ item.descripcion }}
                </div>

                <div class="row items-center q-gutter-x-sm text-caption text-grey-6 q-mt-xs">
                  <span>{{ formatFechaHora(item.fecha) }}</span>
                  <span v-if="item.metodo">&bull; Método: <strong>{{ item.metodo }}</strong></span>
                  <span v-if="item.saldoPendiente !== undefined && item.saldoPendiente > 0" class="text-warning text-weight-bold">
                    &bull; Saldo pendiente: ${{ formatPrecio(item.saldoPendiente) }}
                  </span>
                </div>
              </q-item-section>

              <!-- Folio del ticket -->
              <q-item-section v-if="item.folio" side top>
                <q-badge color="grey-3" text-color="primary" class="font-mono text-weight-bold">
                  #{{ item.folio.substring(0, 8) }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <!-- Footer / Acciones Rápidas -->
        <q-card-actions v-if="kardexClienteSeleccionado" align="right" class="q-pa-sm bg-grey-1 border-top shrink-0">
          <q-btn
            unelevated
            dense
            color="primary"
            icon="point_of_sale"
            label="Cobrar en POS"
            class="text-weight-bold q-px-md"
            @click="iniciarVentaParaCliente(kardexClienteSeleccionado)"
          />
        </q-card-actions>
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

// Estado de Kardex / Historial
const mostrarModalKardex = ref(false);
const kardexClienteSeleccionado = ref(null);
const cargandoKardex = ref(false);
const filtroTipoTimeline = ref('TODOS');
const kardexTimeline = ref([]);
const kardexMetricas = ref({
  totalComprado: 0,
  totalAbonado: 0,
  saldoPendiente: 0,
  totalPiezas: 0,
  totalVentas: 0,
  apartadosActivos: 0
});

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

function obtenerPrimeraLetra(nombre) {
  if (!nombre || typeof nombre !== 'string') return '#';
  const trimmed = nombre.trim();
  if (trimmed.length === 0) return '#';
  const primera = trimmed.charAt(0).toUpperCase();
  if (primera === 'Ñ') return 'Ñ';
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

const conteosPorLetra = computed(() => {
  const conteos = {};
  for (const c of clientesBase.value) {
    const l = obtenerPrimeraLetra(c.Nombre);
    conteos[l] = (conteos[l] || 0) + 1;
  }
  return conteos;
});

const clientesFiltrados = computed(() => {
  let list = clientesBase.value;

  if (letraSeleccionada.value && letraSeleccionada.value !== 'TODOS') {
    list = list.filter((c) => obtenerPrimeraLetra(c.Nombre) === letraSeleccionada.value);
  }

  if (busqueda.value && busqueda.value.trim() !== '') {
    const q = busqueda.value.toLowerCase().trim();
    list = list.filter(
      (c) => c.Nombre?.toLowerCase().includes(q) || c.Telefono?.includes(q)
    );
  }

  return list;
});

const timelineFiltrado = computed(() => {
  if (filtroTipoTimeline.value === 'TODOS') {
    return kardexTimeline.value;
  }
  if (filtroTipoTimeline.value === 'VENTAS') {
    return kardexTimeline.value.filter((it) => it.tipo === 'VENTA' || it.tipo === 'APARTADO');
  }
  if (filtroTipoTimeline.value === 'ABONOS') {
    return kardexTimeline.value.filter((it) => it.tipo === 'ABONO');
  }
  return kardexTimeline.value;
});

async function cargarClientes() {
  try {
    if (networkStore.isOnline) {
      try {
        const resp = await api.get('/clientes');
        if (resp.data && resp.data.success && Array.isArray(resp.data.data)) {
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
            await db.clientes.put(nuevoCliente);
          }
        } catch (apiErr) {
          console.warn('Servidor no disponible, guardando cliente en Dexie:', apiErr.message);
        }
      }

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

      busqueda.value = '';

      if (filtroEmpresaria.value && Number(filtroEmpresaria.value) !== empId) {
        filtroEmpresaria.value = null;
      }

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
  if (mostrarModalKardex.value) {
    mostrarModalKardex.value = false;
  }
  router.push('/');
}

// =========================================================================
// FUNCIONES DE KARDEX / HISTORIAL DE CLIENTES (OFFLINE-FIRST)
// =========================================================================

async function abrirKardexCliente(c) {
  kardexClienteSeleccionado.value = c;
  filtroTipoTimeline.value = 'TODOS';
  mostrarModalKardex.value = true;
  await cargarHistorialCliente(c);
}

async function abrirHistorialGeneral() {
  kardexClienteSeleccionado.value = null;
  filtroTipoTimeline.value = 'TODOS';
  mostrarModalKardex.value = true;
  await cargarHistorialGeneral();
}

async function recargarKardexActual() {
  if (kardexClienteSeleccionado.value) {
    await cargarHistorialCliente(kardexClienteSeleccionado.value);
  } else {
    await cargarHistorialGeneral();
  }
}

async function cargarHistorialCliente(c) {
  cargandoKardex.value = true;
  try {
    // 1. Intentar consultar datos oficiales en línea si hay conexión
    if (networkStore.isOnline) {
      try {
        const resp = await api.get(`/clientes/${c.IdCliente}/historial`);
        if (resp.data && resp.data.success && resp.data.data) {
          kardexMetricas.value = resp.data.data.metricas;
          kardexTimeline.value = resp.data.data.timeline;
          cargandoKardex.value = false;
          return;
        }
      } catch (errApi) {
        console.warn('Fallo consulta online de historial, recurriendo a Dexie local:', errApi.message);
      }
    }

    // 2. Fallback Offline-First: Construir historial local a partir de Dexie
    const ventas = await db.ventas.where('Cliente_Id').equals(c.IdCliente).toArray();
    const ventaIds = ventas.map((v) => v.IdVenta);
    const pagos = await db.pagos.where('VentaId').anyOf(ventaIds).toArray();

    let totalComprado = 0;
    let totalAbonado = 0;
    let apartadosActivos = 0;
    const timeline = [];

    // Agregar evento de registro
    timeline.push({
      id: `reg-${c.IdCliente}`,
      tipo: 'REGISTRO',
      titulo: 'Registro de Clienta',
      descripcion: `Registrada con ${c.EmpresariaNombre || 'Distribuidora Nice'}`,
      fecha: c.created_at || new Date().toISOString(),
      folio: null,
      monto: null
    });

    for (const v of ventas) {
      const vTotal = Number(v.total) || 0;
      totalComprado += vTotal;

      const pagosDeVenta = pagos.filter((p) => p.VentaId === v.IdVenta);
      const pagadoDeVenta = pagosDeVenta.reduce((acc, p) => acc + (Number(p.Cantidad) || 0), 0);
      totalAbonado += pagadoDeVenta;

      const saldoVenta = Math.max(0, vTotal - pagadoDeVenta);
      if (v.TipoVenta === 'APARTADO' && saldoVenta > 0) {
        apartadosActivos++;
      }

      timeline.push({
        id: `v-${v.IdVenta}`,
        tipo: v.TipoVenta === 'APARTADO' ? 'APARTADO' : 'VENTA',
        titulo: v.TipoVenta === 'APARTADO' ? 'Apartado de Joyería' : 'Compra Directa en POS',
        descripcion: `Ticket de venta (${v.TipoVenta}) - ${v.Estado || 'Completada'}`,
        fecha: v.created_at || new Date().toISOString(),
        folio: v.IdVenta,
        monto: vTotal,
        saldoPendiente: saldoVenta
      });

      for (const p of pagosDeVenta) {
        timeline.push({
          id: `p-${p.IdPago || p.id || Math.random()}`,
          tipo: 'ABONO',
          titulo: 'Abono Registrado',
          descripcion: `Pago vía ${p.Metodo_Pago || 'Efectivo'} a ticket #${v.IdVenta.substring(0, 8)}`,
          fecha: p.created_at || new Date().toISOString(),
          folio: v.IdVenta,
          monto: Number(p.Cantidad),
          metodo: p.Metodo_Pago || 'Efectivo',
          saldoRestante: saldoVenta
        });
      }
    }

    timeline.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    kardexMetricas.value = {
      totalComprado,
      totalAbonado,
      saldoPendiente: Math.max(0, totalComprado - totalAbonado),
      totalPiezas: 0,
      totalVentas: ventas.length,
      apartadosActivos
    };
    kardexTimeline.value = timeline;
  } catch (err) {
    console.error('Error cargando historial de clienta:', err);
    $q.notify({ type: 'negative', message: 'Error cargando historial: ' + err.message });
  } finally {
    cargandoKardex.value = false;
  }
}

async function cargarHistorialGeneral() {
  cargandoKardex.value = true;
  try {
    if (networkStore.isOnline) {
      try {
        const resp = await api.get('/clientes/historial/general');
        if (resp.data && resp.data.success && Array.isArray(resp.data.data)) {
          kardexTimeline.value = resp.data.data.map((v) => ({
            id: `v-${v.IdVenta}`,
            tipo: v.TipoVenta === 'APARTADO' ? 'APARTADO' : 'VENTA',
            titulo: v.TipoVenta === 'APARTADO' ? 'Apartado' : 'Venta POS',
            clienteNombre: v.ClienteNombre,
            descripcion: `Ticket #${v.IdVenta.substring(0, 8)} • ${v.TipoVenta} (${v.Estado || 'Completada'})`,
            fecha: v.created_at,
            folio: v.IdVenta,
            monto: Number(v.total),
            saldoPendiente: Number(v.SaldoPendiente || 0)
          }));
          cargandoKardex.value = false;
          return;
        }
      } catch (err) {
        console.warn('Fallback local para historial general:', err.message);
      }
    }

    // Fallback Dexie local
    const ventas = await db.ventas.toArray();
    const clientesMap = new Map((await db.clientes.toArray()).map((c) => [c.IdCliente, c.Nombre]));

    kardexTimeline.value = ventas.map((v) => ({
      id: `v-${v.IdVenta}`,
      tipo: v.TipoVenta === 'APARTADO' ? 'APARTADO' : 'VENTA',
      titulo: v.TipoVenta === 'APARTADO' ? 'Apartado' : 'Venta POS',
      clienteNombre: clientesMap.get(v.Cliente_Id) || 'Venta Mostrador',
      descripcion: `Ticket #${v.IdVenta.substring(0, 8)} (${v.TipoVenta})`,
      fecha: v.created_at || new Date().toISOString(),
      folio: v.IdVenta,
      monto: Number(v.total) || 0
    })).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  } catch (err) {
    console.error('Error al cargar historial general:', err);
  } finally {
    cargandoKardex.value = false;
  }
}

function compartirEstadoCuentaWhatsApp(cliente, metricas) {
  if (!cliente || !cliente.Telefono) {
    $q.notify({ type: 'warning', message: 'El cliente no tiene teléfono registrado' });
    return;
  }

  const telLimpio = cliente.Telefono.replace(/\D/g, '');
  const mensaje =
    `*Hola ${cliente.Nombre} 👋✨*\n` +
    `Te compartimos tu estado de cuenta de *Joyería Nice & Bella*:\n\n` +
    `🛍️ *Total Comprado:* $${formatPrecio(metricas.totalComprado)}\n` +
    `💵 *Abonos Realizados:* $${formatPrecio(metricas.totalAbonado)}\n` +
    `⭐ *Saldo Pendiente:* $${formatPrecio(metricas.saldoPendiente)}\n` +
    (metricas.apartadosActivos > 0 ? `📦 *Apartados Activos:* ${metricas.apartadosActivos}\n` : '') +
    `\n¡Agradecemos mucho tu preferencia! 💎`;

  window.open(`https://wa.me/52${telLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

function formatPrecio(val) {
  if (val === null || val === undefined || isNaN(val)) return '0.00';
  return Number(val).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatFechaHora(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function getColorEvento(tipo) {
  switch (tipo) {
    case 'VENTA':
      return 'primary';
    case 'APARTADO':
      return 'warning';
    case 'ABONO':
      return 'positive';
    case 'REGISTRO':
      return 'secondary';
    default:
      return 'grey-7';
  }
}

function getIconoEvento(tipo) {
  switch (tipo) {
    case 'VENTA':
      return 'shopping_bag';
    case 'APARTADO':
      return 'bookmark';
    case 'ABONO':
      return 'payments';
    case 'REGISTRO':
      return 'how_to_reg';
    default:
      return 'receipt';
  }
}

function getColorMonto(tipo) {
  if (tipo === 'ABONO') return 'text-positive';
  if (tipo === 'APARTADO') return 'text-warning';
  return 'text-primary';
}

function getSignoMonto(tipo) {
  if (tipo === 'ABONO') return '+';
  return '';
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

.bg-white-10 {
  background: rgba(255, 255, 255, 0.12);
}
</style>
