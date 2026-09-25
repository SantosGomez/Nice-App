<template>
  <q-page class="q-pa-md bg-grey-1">
    <!-- Encabezado y Métricas de Ventas -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <div class="text-h5 text-weight-bolder text-primary brand-font">
          Historial de Ventas & Apartados
        </div>
        <div class="text-caption text-grey-7">
          Consulta tickets generados en la tablet y gestiona abonos de clientes
        </div>
      </div>

      <!-- Tarjetas de Resumen y Exportar -->
      <div class="col-12 col-md-6">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-3">
            <q-card flat class="bg-white rounded-borders shadow-1 q-pa-sm text-center">
              <div class="text-caption text-grey-6">Ventas</div>
              <div class="text-h6 text-weight-bolder text-primary">{{ ventas.length }}</div>
            </q-card>
          </div>
          <div class="col-3">
            <q-card flat class="bg-white rounded-borders shadow-1 q-pa-sm text-center">
              <div class="text-caption text-grey-6">Ingresos</div>
              <div class="text-h6 text-weight-bolder text-positive">${{ formatPrecio(totalIngresos) }}</div>
            </q-card>
          </div>
          <div class="col-3">
            <q-card flat class="bg-white rounded-borders shadow-1 q-pa-sm text-center">
              <div class="text-caption text-grey-6">Por Cobrar</div>
              <div class="text-h6 text-weight-bolder text-warning">${{ formatPrecio(totalPorCobrar) }}</div>
            </q-card>
          </div>
          <div class="col-3 text-center">
            <q-btn
              flat
              rounded
              dense
              color="primary"
              icon="download"
              label="Excel"
              class="full-width bg-white shadow-1 text-weight-bold q-py-xs"
              @click="exportarExcelVentas"
            >
              <q-tooltip>Descargar reporte de ventas en Excel</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Pestañas de Filtro y Buscador -->
    <q-card flat class="rounded-borders shadow-1 q-mb-md bg-white">
      <q-card-section class="q-py-xs">
        <div class="row q-col-gutter-sm items-center justify-between">
          <div class="col-12 col-sm-6">
            <q-tabs
              v-model="tabFiltro"
              dense
              align="left"
              class="text-primary"
              active-color="secondary"
              indicator-color="secondary"
            >
              <q-tab name="todas" label="Todas" />
              <q-tab name="directas" label="Directas" />
              <q-tab name="apartados" label="Apartados Pendientes" />
            </q-tabs>
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model="busqueda"
              dense
              outlined
              rounded
              clearable
              placeholder="Buscar por folio o cliente..."
              class="bg-grey-1"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Lista de Ventas en Tarjetas -->
    <div v-if="ventasFiltradas.length > 0" class="row q-col-gutter-sm">
      <div
        v-for="v in ventasFiltradas"
        :key="v.IdVenta"
        class="col-12 col-sm-6 col-lg-4"
      >
        <q-card flat class="rounded-borders shadow-1 bg-white column full-height justify-between">
          <q-card-section class="q-pa-md">
            <!-- Fila Superior: Folio, Estado y Sync -->
            <div class="row items-center justify-between q-mb-xs">
              <div class="row items-center q-gutter-x-xs">
                <span class="text-weight-bold text-primary font-mono">
                  #{{ v.IdVenta.substring(0, 8) }}
                </span>
                <q-badge
                  :color="v.synced ? 'positive' : 'warning'"
                  rounded
                  class="q-pa-none"
                  style="width: 8px; height: 8px;"
                >
                  <q-tooltip>{{ v.synced ? 'Sincronizado con la nube' : 'Guardado offline en la tablet' }}</q-tooltip>
                </q-badge>
              </div>

              <div class="row q-gutter-x-xs">
                <q-badge
                  :color="v.TipoVenta === 'DIRECTA' ? 'primary' : 'purple-8'"
                  class="text-weight-bold"
                >
                  {{ v.TipoVenta }}
                </q-badge>
                <q-badge
                  :color="v.Estado === 'COMPLETADA' ? 'positive' : 'warning'"
                  class="text-weight-bold"
                >
                  {{ v.Estado }}
                </q-badge>
              </div>
            </div>

            <!-- Cliente y Fecha -->
            <div class="text-subtitle1 text-weight-bold text-primary q-mt-xs">
              {{ v.ClienteNombre || 'Cliente Mostrador / General' }}
            </div>
            <div class="text-caption text-grey-6">
              {{ formatFecha(v.created_at) }}
            </div>

            <q-separator spaced class="q-my-sm" />

            <!-- Resumen Financiero -->
            <div class="row items-center justify-between text-body2">
              <span class="text-grey-7">Total Venta:</span>
              <span class="text-weight-bold text-primary">${{ formatPrecio(v.total) }}</span>
            </div>
            <div class="row items-center justify-between text-body2">
              <span class="text-grey-7">Pagado / Abonado:</span>
              <span class="text-weight-bold text-positive">${{ formatPrecio(v.TotalPagado) }}</span>
            </div>

            <!-- Saldo Pendiente (si aplica) -->
            <div
              v-if="v.Estado === 'PENDIENTE'"
              class="row items-center justify-between text-subtitle2 text-weight-bolder text-warning q-mt-xs"
            >
              <span>Saldo por liquidar:</span>
              <span>${{ formatPrecio(v.SaldoPendiente) }}</span>
            </div>
          </q-card-section>

          <!-- Acciones de Tarjeta -->
          <q-card-actions class="q-px-md q-pb-md q-pt-none row q-gutter-xs">
            <q-btn
              outline
              dense
              color="primary"
              label="Ticket"
              icon="receipt"
              class="col text-weight-bold"
              @click="verDetalleVenta(v)"
            />
            <q-btn
              v-if="v.Estado === 'PENDIENTE'"
              unelevated
              dense
              color="secondary"
              text-color="primary"
              label="Abonar"
              icon="payments"
              class="col text-weight-bolder"
              @click="abrirModalAbono(v)"
            />
            <q-btn
              v-if="v.Estado === 'PENDIENTE'"
              flat
              dense
              round
              color="positive"
              icon="chat"
              class="bg-green-1"
              @click="enviarRecordatorioWhatsApp(v)"
            >
              <q-tooltip>Enviar recordatorio de abono por WhatsApp</q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Estado Vacío -->
    <div v-else class="text-center q-pa-xl text-grey-6">
      <q-icon name="receipt_long" size="64px" color="grey-4" />
      <div class="text-h6 q-mt-sm">No se encontraron ventas</div>
      <div class="text-caption">Las ventas que cobres en el POS aparecerán registradas aquí</div>
    </div>

    <!-- Modal: Detalle de Venta / Ticket -->
    <q-dialog v-model="mostrarModalDetalle">
      <q-card style="min-width: 320px; max-width: 500px; border-radius: 16px;">
        <q-card-section class="gradient-navy text-white row items-center">
          <div class="text-h6 brand-font text-gold">Ticket de Venta #{{ ventaSeleccionada?.IdVenta?.substring(0, 8) }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="ventaSeleccionada" class="q-pa-md">
          <div class="text-caption text-grey-7">Cliente: <strong class="text-primary">{{ ventaSeleccionada.ClienteNombre || 'Mostrador' }}</strong></div>
          <div class="text-caption text-grey-7 q-mb-sm">Fecha: {{ formatFecha(ventaSeleccionada.created_at) }}</div>

          <q-separator class="q-my-sm" />

          <!-- Partidas Vendidas -->
          <div class="text-weight-bold text-subtitle2 q-mb-xs">Partidas:</div>
          <q-list separator class="q-mb-md">
            <q-item v-for="item in detalleItems" :key="item.ProductoId" dense class="q-px-none">
              <q-item-section>
                <q-item-label class="text-weight-bold text-primary">{{ item.ProductoNombre || item.ProductoId }}</q-item-label>
                <q-item-label caption>{{ item.Cantidad }} x ${{ formatPrecio(item.Precio_unit) }}</q-item-label>
              </q-item-section>
              <q-item-section side class="text-weight-bolder text-primary">
                ${{ formatPrecio(item.Cantidad * item.Precio_unit) }}
              </q-item-section>
            </q-item>
          </q-list>

          <q-separator class="q-my-sm" />

          <!-- Historial de Pagos -->
          <div class="text-weight-bold text-subtitle2 q-mb-xs">Pagos y Abonos:</div>
          <q-list dense separator class="q-mb-md">
            <q-item v-for="pago in detallePagos" :key="pago.IdPago || pago.Cantidad" class="q-px-none">
              <q-item-section>
                <q-item-label class="text-caption text-weight-bold">{{ pago.Metodo_Pago || 'Efectivo' }}</q-item-label>
                <q-item-label caption>{{ formatFecha(pago.created_at) }}</q-item-label>
              </q-item-section>
              <q-item-section side class="text-weight-bold text-positive">
                +${{ formatPrecio(pago.Cantidad) }}
              </q-item-section>
            </q-item>
          </q-list>

          <div class="bg-grey-2 q-pa-sm rounded-borders q-mb-md">
            <div class="row justify-between text-body1 text-weight-bold text-primary">
              <span>Total:</span>
              <span>${{ formatPrecio(ventaSeleccionada.total) }}</span>
            </div>
            <div v-if="ventaSeleccionada.SaldoPendiente > 0" class="row justify-between text-subtitle2 text-weight-bold text-warning q-mt-xs">
              <span>Saldo Pendiente:</span>
              <span>${{ formatPrecio(ventaSeleccionada.SaldoPendiente) }}</span>
            </div>
          </div>

          <!-- Botones de Acción del Ticket -->
          <div class="row q-gutter-xs">
            <q-btn
              unelevated
              class="col bg-positive text-white text-weight-bold"
              icon="chat"
              label="WhatsApp"
              @click="enviarTicketDetalleWhatsApp"
            />
            <q-btn
              outline
              color="primary"
              icon="print"
              label="Imprimir"
              class="col text-weight-bold"
              @click="imprimirTicket"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Modal: Registrar Abono a Apartado -->
    <q-dialog v-model="mostrarModalAbono">
      <q-card style="min-width: 320px; max-width: 440px; border-radius: 16px;">
        <q-card-section class="gradient-navy text-white row items-center">
          <div class="text-h6 brand-font text-gold">Registrar Abono</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="ventaAbono" class="q-pa-md">
          <div class="text-caption text-grey-7">Cliente: <strong>{{ ventaAbono.ClienteNombre || 'Mostrador' }}</strong></div>
          <div class="text-subtitle1 text-weight-bold text-warning q-mb-sm">
            Saldo Restante: ${{ formatPrecio(ventaAbono.SaldoPendiente) }}
          </div>

          <div class="q-mb-sm">
            <label class="text-caption text-weight-bold text-grey-8">Cantidad a Abonar ($) *</label>
            <q-input
              v-model.number="formAbono.cantidad"
              type="number"
              dense
              outlined
              prefix="$"
              min="1"
              :max="ventaAbono.SaldoPendiente"
              class="q-mt-xs"
            />
          </div>

          <div class="q-mb-md">
            <label class="text-caption text-weight-bold text-grey-8">Método de Pago</label>
            <q-select
              v-model="formAbono.metodoPago"
              :options="['Efectivo', 'Tarjeta', 'Transferencia']"
              dense
              outlined
              class="q-mt-xs"
            />
          </div>

          <q-btn
            unelevated
            class="full-width gradient-gold text-primary text-weight-bolder text-subtitle1 q-py-sm"
            label="CONFIRMAR ABONO"
            :disable="!formAbono.cantidad || formAbono.cantidad <= 0"
            @click="guardarAbono"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import db from '../db/index.js';
import api from '../services/api.js';
import { useNetworkStore } from '../stores/networkStore.js';

const $q = useQuasar();
const networkStore = useNetworkStore();

const ventas = ref([]);
const busqueda = ref('');
const tabFiltro = ref('todas');

const mostrarModalDetalle = ref(false);
const ventaSeleccionada = ref(null);
const detalleItems = ref([]);
const detallePagos = ref([]);

const mostrarModalAbono = ref(false);
const ventaAbono = ref(null);
const formAbono = ref({
  cantidad: 0,
  metodoPago: 'Efectivo'
});

async function cargarVentas() {
  try {
    const rawVentas = await db.ventas.reverse().toArray();
    const clientes = await db.clientes.toArray();
    const clienteMap = new Map();
    clientes.forEach((c) => clienteMap.set(c.IdCliente, c.Nombre));

    // Hidratar con pagos y cálculo de saldos
    const ventasCompletas = [];
    for (const v of rawVentas) {
      const pagos = await db.pagos.where('VentaId').equals(v.IdVenta).toArray();
      const totalPagado = pagos.reduce((acc, p) => acc + Number(p.Cantidad), 0);
      const saldoPendiente = Math.max(0, Number(v.total) - totalPagado);

      ventasCompletas.push({
        ...v,
        ClienteNombre: clienteMap.get(v.Cliente_Id) || null,
        TotalPagado: totalPagado,
        SaldoPendiente: saldoPendiente,
        pagosList: pagos
      });
    }

    ventas.value = ventasCompletas;
  } catch (err) {
    console.error('Error cargando ventas:', err);
  }
}

const ventasFiltradas = computed(() => {
  return ventas.value.filter((v) => {
    // Filtro pestaña
    if (tabFiltro.value === 'directas' && v.TipoVenta !== 'DIRECTA') return false;
    if (tabFiltro.value === 'apartados' && v.Estado !== 'PENDIENTE') return false;

    // Filtro texto
    if (!busqueda.value) return true;
    const q = busqueda.value.toLowerCase();
    return (
      v.IdVenta?.toLowerCase().includes(q) ||
      v.ClienteNombre?.toLowerCase().includes(q)
    );
  });
});

const totalIngresos = computed(() => {
  return ventas.value.reduce((acc, v) => acc + (v.TotalPagado || 0), 0);
});

const totalPorCobrar = computed(() => {
  return ventas.value.reduce((acc, v) => acc + (v.SaldoPendiente || 0), 0);
});

function formatPrecio(val) {
  return Number(val || 0).toFixed(2);
}

function formatFecha(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function verDetalleVenta(v) {
  ventaSeleccionada.value = v;
  // Cargar partidas y productos
  const items = await db.sale_items.where('VentaId').equals(v.IdVenta).toArray();
  const prods = await db.productos.toArray();
  const prodMap = new Map();
  prods.forEach((p) => prodMap.set(p.id, p.Nombre));

  detalleItems.value = items.map((i) => ({
    ...i,
    ProductoNombre: prodMap.get(i.ProductoId)
  }));
  detallePagos.value = v.pagosList || [];
  mostrarModalDetalle.value = true;
}

function abrirModalAbono(v) {
  ventaAbono.value = v;
  formAbono.value = {
    cantidad: v.SaldoPendiente,
    metodoPago: 'Efectivo'
  };
  mostrarModalAbono.value = true;
}

async function guardarAbono() {
  try {
    const { cantidad, metodoPago } = formAbono.value;
    const v = ventaAbono.value;

    if (!cantidad || cantidad <= 0) {
      $q.notify({ type: 'warning', message: 'Ingresa un monto válido' });
      return;
    }

    const nuevoPago = {
      VentaId: v.IdVenta,
      Cantidad: Number(cantidad),
      Metodo_Pago: metodoPago,
      created_at: new Date().toISOString()
    };

    // 1. Guardar pago en Dexie
    await db.pagos.add(nuevoPago);

    // 2. Verificar si ya se liquida el saldo
    const nuevoTotalPagado = v.TotalPagado + Number(cantidad);
    const nuevoEstado = nuevoTotalPagado >= Number(v.total) ? 'COMPLETADA' : 'PENDIENTE';

    await db.ventas.update(v.IdVenta, {
      Estado: nuevoEstado,
      synced: 0 // Marcar para sincronizar al backend
    });

    // 3. Si hay conexión, enviar al backend
    if (networkStore.isOnline) {
      api.post(`/ventas/${v.IdVenta}/pagos`, {
        Cantidad: Number(cantidad),
        Metodo_Pago: metodoPago
      }).catch((e) => console.warn('Sync abono backend en cola:', e.message));
    }

    $q.notify({
      type: 'positive',
      message: `Abono de $${formatPrecio(cantidad)} registrado.${nuevoEstado === 'COMPLETADA' ? ' ¡Apartado liquidado!' : ''}`
    });

    mostrarModalAbono.value = false;
    await cargarVentas();
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Error al registrar abono: ' + err.message });
  }
}

async function enviarRecordatorioWhatsApp(v) {
  let tel = v.ClienteTelefono || '';
  if (!tel && v.Cliente_Id) {
    const c = await db.clientes.get(v.Cliente_Id);
    if (c?.Telefono) tel = c.Telefono;
  }

  const nombreCliente = v.ClienteNombre || 'Estimada clienta';
  const folio = v.IdVenta.substring(0, 8).toUpperCase();
  const total = Number(v.total).toFixed(2);
  const pagado = Number(v.TotalPagado || 0).toFixed(2);
  const saldo = Number(v.SaldoPendiente || 0).toFixed(2);

  const msg =
    `Hola ${nombreCliente} 👋 Te saludamos con gusto de Joyería Nice ✨\n` +
    `Te compartimos el estado de tu apartado:\n` +
    `🧾 *Folio:* #${folio}\n` +
    `💰 *Total de Joyas:* $${total}\n` +
    `💵 *Abonado:* $${pagado}\n` +
    `⚠️ *SALDO PENDIENTE:* $${saldo}\n` +
    `--------------------------------\n` +
    `¿Deseas programar tu abono o pasar a recoger tus piezas? Quedamos a tus órdenes 💍💎✨`;

  const encoded = encodeURIComponent(msg);
  const telLimpio = String(tel || '').replace(/\D/g, '');

  const url = telLimpio
    ? `https://wa.me/${telLimpio.length === 10 ? '52' + telLimpio : telLimpio}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(url, '_blank');
}

async function enviarTicketDetalleWhatsApp() {
  if (!ventaSeleccionada.value) return;
  const v = ventaSeleccionada.value;
  const folio = v.IdVenta.substring(0, 8).toUpperCase();
  const fechaStr = formatFecha(v.created_at);

  const itemsStr = detalleItems.value
    .map(
      (i) =>
        `• ${i.Cantidad}x ${i.ProductoNombre || i.ProductoId} ($${Number(i.Precio_unit).toFixed(2)}) = $${(i.Cantidad * i.Precio_unit).toFixed(2)}`
    )
    .join('\n');

  const titulo =
    v.TipoVenta === 'APARTADO'
      ? '💎 *COMPROBANTE DE APARTADO NICE* 💎'
      : '💎 *COMPROBANTE DE VENTA NICE* 💎';

  let msg =
    `${titulo}\n` +
    `📅 *Fecha:* ${fechaStr}\n` +
    `🧾 *Folio:* #${folio}\n` +
    `👤 *Cliente:* ${v.ClienteNombre || 'Venta General'}\n` +
    `--------------------------------\n` +
    `🛍️ *DETALLE:*\n${itemsStr}\n` +
    `--------------------------------\n` +
    `💰 *TOTAL:* $${Number(v.total).toFixed(2)}\n` +
    `💵 *PAGADO:* $${Number(v.TotalPagado || 0).toFixed(2)}\n`;

  if (v.SaldoPendiente > 0) {
    msg += `⚠️ *SALDO PENDIENTE:* $${Number(v.SaldoPendiente).toFixed(2)}\n`;
  }

  msg +=
    `--------------------------------\n` +
    `¡Muchas gracias por tu compra en Joyería Nice! 💍✨`;

  let tel = v.ClienteTelefono || '';
  if (!tel && v.Cliente_Id) {
    const c = await db.clientes.get(v.Cliente_Id);
    if (c?.Telefono) tel = c.Telefono;
  }

  const encoded = encodeURIComponent(msg);
  const telLimpio = String(tel || '').replace(/\D/g, '');

  const url = telLimpio
    ? `https://wa.me/${telLimpio.length === 10 ? '52' + telLimpio : telLimpio}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(url, '_blank');
}

function imprimirTicket() {
  window.print();
}

async function exportarExcelVentas() {
  try {
    const XLSX = await import('xlsx');
    const dataToExport = ventasFiltradas.value.map((v) => ({
      'Folio': '#' + v.IdVenta.substring(0, 8).toUpperCase(),
      'Fecha': formatFecha(v.created_at),
      'Cliente': v.ClienteNombre || 'Mostrador / General',
      'Tipo': v.TipoVenta,
      'Estado': v.Estado,
      'Total ($)': Number(v.total || 0),
      'Total Pagado ($)': Number(v.TotalPagado || 0),
      'Saldo Pendiente ($)': Number(v.SaldoPendiente || 0),
      'Sincronizado': v.synced ? 'Sí' : 'No (Local)'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');

    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 20 },
      { wch: 28 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 }
    ];

    const fechaStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Ventas_Nice_${fechaStr}.xlsx`);

    $q.notify({
      type: 'positive',
      message: 'Reporte de ventas exportado a Excel exitosamente.',
      icon: 'file_download'
    });
  } catch (err) {
    console.error('Error exportando ventas:', err);
    $q.notify({
      type: 'negative',
      message: 'Error al exportar ventas a Excel: ' + err.message
    });
  }
}

onMounted(() => {
  cargarVentas();
});
</script>

<style scoped>
.font-mono {
  font-family: monospace;
}
</style>
