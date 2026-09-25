<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="row q-col-gutter-md full-height">
      <!-- Columna Izquierda: Catálogo de Productos y Búsqueda -->
      <div class="col-12 col-md-7 col-lg-8">
        <q-card flat class="rounded-borders shadow-1 q-mb-md bg-white">
          <q-card-section class="q-pb-sm">
            <!-- Barra de Búsqueda y Filtros -->
            <div class="row q-col-gutter-sm items-center">
              <div class="col">
                <q-input
                  v-model="filtroBusqueda"
                  dense
                  outlined
                  rounded
                  clearable
                  placeholder="Buscar por Nombre, SKU o Código QR..."
                  class="bg-grey-1"
                >
                  <template #prepend>
                    <q-icon name="search" color="primary" />
                  </template>
                </q-input>
              </div>

              <!-- Botón Escanear QR -->
              <div class="col-auto">
                <q-btn
                  unelevated
                  rounded
                  color="secondary"
                  text-color="primary"
                  icon="qr_code_scanner"
                  label="Escanear"
                  class="text-weight-bold"
                  @click="abrirEscanerQR"
                />
              </div>
            </div>

            <!-- Chips de Categorías -->
            <div class="row q-gutter-xs q-mt-sm overflow-auto no-wrap q-py-xs">
              <q-chip
                v-for="cat in categorias"
                :key="cat"
                clickable
                :color="categoriaSeleccionada === cat ? 'primary' : 'grey-2'"
                :text-color="categoriaSeleccionada === cat ? 'white' : 'grey-8'"
                class="text-weight-medium"
                @click="categoriaSeleccionada = cat"
              >
                {{ cat }}
              </q-chip>
            </div>
          </q-card-section>
        </q-card>

        <!-- Cuadrícula de Productos -->
        <div v-if="productosFiltrados.length > 0">
          <div class="row q-col-gutter-sm">
            <div
              v-for="prod in productosPaginadosGrid"
              :key="prod.id"
              class="col-6 col-sm-4 col-md-4 col-lg-3"
            >
              <q-card
                class="touch-card column full-height no-shadow border-light bg-white"
                @click="agregarAlCarrito(prod)"
              >
                <!-- Imagen o Placeholder con Icono Elegante -->
                <div class="relative-position bg-grey-2 text-center q-pa-sm" style="height: 120px;">
                  <q-img
                    v-if="prod.ImgURL"
                    :src="formatImagenUrl(prod.ImgURL)"
                    fit="contain"
                    class="full-height rounded-borders"
                  />
                  <div v-else class="column items-center justify-center full-height text-grey-5">
                    <q-icon name="diamond" size="42px" color="secondary" />
                    <span class="text-caption" style="font-size: 0.65rem;">Nice Joyería</span>
                  </div>

                  <!-- Badge de Stock de la Empresaria -->
                  <q-badge
                    :color="prod.Stock > 0 ? 'positive' : 'grey-6'"
                    class="absolute-top-right q-ma-xs text-weight-bold"
                  >
                    {{ prod.Stock > 0 ? `${prod.Stock} disp.` : 'Sin stock' }}
                  </q-badge>
                </div>

                <q-card-section class="q-pa-sm col column justify-between">
                  <div>
                    <div class="text-caption text-grey-6 text-weight-medium">
                      Código: {{ prod.id }}
                    </div>
                    <div class="text-caption text-grey-6 text-weight-medium">
                      Categoría: {{ prod.Categoria }}
                    </div>
                    <div class="text-weight-bold text-subtitle2 text-primary line-clamp-2" style="min-height: 38px; margin-top: 5px;">
                      {{ prod.Nombre }}
                    </div>
                  </div>

                  <div class="row items-center justify-between q-mt-xs">
                    <div class="text-h6 text-weight-bolder text-primary">
                      ${{ formatPrecio(prod.Precio) }}
                    </div>
                    <q-btn
                      round
                      dense
                      size="sm"
                      color="secondary"
                      text-color="primary"
                      icon="add"
                      class="shadow-1"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Paginación Vista Cuadrícula POS -->
          <div class="row items-center justify-between q-mt-md q-pa-sm bg-white rounded-borders shadow-1 wrap q-gutter-y-sm">
            <div class="text-caption text-grey-7 row items-center q-gutter-x-sm">
              <span>
                Mostrando <b>{{ inicioRegistroGrid }}</b> a <b>{{ finRegistroGrid }}</b> de <b>{{ productosFiltrados.length }}</b> joyas
              </span>
              <q-select
                v-model="porPaginaGrid"
                :options="[8, 12, 16, 24, 48]"
                dense
                outlined
                options-dense
                style="min-width: 80px"
                label="Por pág."
              />
            </div>
            <q-pagination
              v-model="paginaActualGrid"
              :max="maxPaginasGrid"
              :max-pages="5"
              boundary-numbers
              direction-links
              color="primary"
              active-color="secondary"
              active-text-color="dark"
              gutter="xs"
              dense
            />
          </div>
        </div>

        <!-- Estado Vacío -->
        <div v-else class="text-center q-pa-xl text-grey-6">
          <q-icon name="inventory_2" size="64px" color="grey-4" />
          <div class="text-h6 q-mt-sm">No se encontraron productos</div>
          <div class="text-caption">
            {{ filtroBusqueda ? 'Intenta con otro término de búsqueda' : 'Sincroniza el catálogo desde la nube con el botón superior' }}
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Ticket / Carrito de Venta POS -->
      <div class="col-12 col-md-5 col-lg-4">
        <q-card flat class="rounded-borders shadow-2 bg-white column" style="min-height: 520px;">
          <!-- Cabecera del Ticket -->
          <q-card-section class="gradient-navy text-white q-py-sm">
            <div class="row items-center justify-between">
              <div class="row items-center q-gutter-x-xs">
                <q-icon name="shopping_bag" color="secondary" size="22px" />
                <span class="text-subtitle1 text-weight-bold text-gold brand-font">
                  Venta Actual
                </span>
              </div>
              <q-badge color="secondary" text-color="primary" class="text-weight-bold">
                {{ posStore.totalArticulos }} piezas
              </q-badge>
            </div>

            <!-- Selector de Tipo de Venta: Directa o Apartado -->
            <q-btn-toggle
              v-model="posStore.tipoVenta"
              spread
              no-caps
              rounded
              dense
              class="q-mt-sm gold-border"
              toggle-color="secondary"
              toggle-text-color="primary"
              color="primary"
              text-color="grey-4"
              :options="[
                { label: 'Venta Directa', value: 'DIRECTA' },
                { label: 'Sistema Apartado', value: 'APARTADO' }
              ]"
            />
          </q-card-section>

          <!-- Asignación de Cliente -->
          <q-card-section class="q-py-xs bg-grey-2 border-bottom">
            <div class="row items-center justify-between">
              <div class="col row items-center no-wrap">
                <q-icon name="person" color="primary" size="18px" class="q-mr-xs" />
                <span class="text-caption text-weight-bold text-primary ellipsis">
                  {{ posStore.clienteSeleccionado ? posStore.clienteSeleccionado.Nombre : 'Venta a Mostrador / General' }}
                </span>
              </div>
              <q-btn
                dense
                size="sm"
                color="secondary"
                :label="posStore.clienteSeleccionado ? 'Cambiar' : 'Asignar'"
                @click="mostrarDialogoCliente = true"
              />
            </div>
          </q-card-section>

          <!-- Lista de Artículos en el Carrito -->
          <q-card-section class="col q-pa-none overflow-auto" style="max-height: 280px;">
            <q-list v-if="posStore.carrito.length > 0" separator>
              <q-item
                v-for="item in posStore.carrito"
                :key="item.id"
                class="q-py-xs"
              >
                <q-item-section>
                  <q-item-label class="text-weight-bold text-primary ellipsis">
                    {{ item.Nombre }}
                  </q-item-label>
                  <q-item-label caption>
                    codigo: {{ item.id }} • ${{ formatPrecio(item.Precio) }} c/u
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row items-center no-wrap q-gutter-x-xs">
                    <q-btn
                      round
                      dense
                      size="sm"
                      icon="remove"
                      color="red"
                      @click="posStore.modificarCantidad(item.id, -1)"
                    />
                    <span class="text-weight-bold text-subtitle2 text-primary q-px-xs">
                      {{ item.cantidad }}
                    </span>
                    <q-btn
                      round
                      dense
                      size="sm"
                      icon="add"
                      color="primary"
                      @click="posStore.modificarCantidad(item.id, 1)"
                    />
                    <div class="text-weight-bolder text-primary q-ml-sm" style="min-width: 60px; text-align: right;">
                      ${{ formatPrecio(item.Precio * item.cantidad) }}
                    </div>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="column items-center justify-center full-height text-grey-4 q-pa-lg">
              <q-icon name="shopping_cart" size="48px" />
              <div class="text-subtitle2 q-mt-sm text-grey-5">Carrito vacío</div>
              <div class="text-caption text-grey-5">Toca cualquier joya para añadirla</div>
            </div>
          </q-card-section>

          <!-- Resumen Financiero y Cobro -->
          <div class="bg-grey-1 q-pa-md border-top">
            <!-- Margen y Ganancia de la Empresaria -->
            <div class="row items-center justify-between text-caption text-grey-7 q-mb-xs">
              <span>Descuento Distribuidora ({{ empresariaStore.descuentoActivo }}%):</span>
              <span class="text-positive text-weight-bold">+${{ formatPrecio(posStore.gananciaEstimada) }}</span>
            </div>

            <!-- Importe Total -->
            <div class="row items-center justify-between q-mb-sm">
              <span class="text-subtitle1 text-weight-bold text-primary">Total:</span>
              <span class="text-h5 text-weight-bolder text-primary">
                ${{ formatPrecio(posStore.totalCobro) }}
              </span>
            </div>

            <!-- Opciones específicas de Apartado -->
            <div v-if="posStore.tipoVenta === 'APARTADO'" class="q-mb-sm">
              <q-input
                v-model.number="posStore.montoAbonoApartado"
                type="number"
                dense
                outlined
                label="Abono Inicial / Enganche ($)"
                prefix="$"
                class="bg-white"
              />
            </div>

            <!-- Método de Pago -->
            <div class="row q-gutter-xs q-mb-sm">
              <q-btn
                v-for="metodo in ['Efectivo', 'Tarjeta', 'Transferencia']"
                :key="metodo"
                dense
                no-caps
                class="col text-weight-medium"
                :color="posStore.metodoPago === metodo ? 'primary' : 'white'"
                :text-color="posStore.metodoPago === metodo ? 'white' : 'grey-9'"
                :outline="posStore.metodoPago !== metodo"
                :label="metodo"
                @click="posStore.metodoPago = metodo"
              />
            </div>

            <!-- Campo de Recibido / Cambio para Efectivo -->
            <div v-if="posStore.metodoPago === 'Efectivo'" class="row q-col-gutter-xs items-center q-mb-sm">
              <div class="col-7">
                <q-input
                  v-model.number="posStore.montoRecibido"
                  type="number"
                  dense
                  outlined
                  label="Efectivo Recibido"
                  prefix="$"
                  class="bg-white"
                />
              </div>
              <div class="col-5 text-right">
                <div class="text-caption text-grey-6">Cambio:</div>
                <div class="text-subtitle1 text-weight-bolder text-positive">
                  ${{ formatPrecio(posStore.cambioCalculado) }}
                </div>
              </div>
            </div>

            <!-- Botones de Acción -->
            <div class="row q-gutter-xs q-mt-xs">
              <q-btn
                flat
                color="negative"
                icon="delete"
                dense
                :disable="posStore.carrito.length === 0"
                @click="posStore.limpiarCarrito"
              >
                <q-tooltip>Vaciar Carrito</q-tooltip>
              </q-btn>

              <q-btn
                unelevated
                class="col gradient-gold text-primary text-weight-bolder text-subtitle1 q-py-sm"
                :disable="posStore.carrito.length === 0"
                :label="posStore.tipoVenta === 'APARTADO' ? 'REGISTRAR APARTADO' : `COBRAR $${formatPrecio(posStore.totalCobro)}`"
                @click="confirmarCobro"
              />
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Diálogo de Asignar / Registrar Cliente -->
    <q-dialog v-model="mostrarDialogoCliente">
      <q-card style="min-width: 320px; max-width: 480px; border-radius: 16px;">
        <q-card-section class="gradient-navy text-white row items-center">
          <div class="text-h6 brand-font text-gold">Seleccionar Cliente</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-sm">
          <q-input
            v-model="busquedaCliente"
            dense
            outlined
            placeholder="Buscar por nombre o teléfono..."
            class="q-mb-sm"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>

          <q-list bordered separator style="max-height: 200px; overflow-y: auto;">
            <q-item clickable v-ripple @click="seleccionarCliente(null)">
              <q-item-section>
                <q-item-label class="text-weight-bold">Venta General / Mostrador</q-item-label>
                <q-item-label caption>Sin registro de cliente</q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              v-for="c in clientesFiltrados"
              :key="c.IdCliente"
              clickable
              v-ripple
              @click="seleccionarCliente(c)"
            >
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ c.Nombre }}</q-item-label>
                <q-item-label caption>{{ c.Telefono || 'Sin teléfono' }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <q-separator spaced />

          <!-- Formulario Rápido para Nuevo Cliente -->
          <div class="text-subtitle2 text-primary q-mb-xs">Crear Nuevo Cliente Rápido:</div>
          <q-input v-model="nuevoCliente.Nombre" dense outlined label="Nombre completo *" class="q-mb-xs" />
          <q-input v-model="nuevoCliente.Telefono" dense outlined label="Teléfono (WhatsApp)" class="q-mb-xs" />
          <q-btn
            unelevated
            color="primary"
            label="Guardar y Asignar"
            class="full-width q-mt-xs"
            @click="crearYAsignarCliente"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Diálogo Escáner QR HTML5 -->
    <q-dialog v-model="mostrarScanner">
      <q-card style="min-width: 320px; max-width: 500px; border-radius: 16px;">
        <q-card-section class="gradient-navy text-white row items-center">
          <div class="text-h6 brand-font text-gold">Escanear Joya Nice</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup @click="cerrarEscaner" />
        </q-card-section>
        <q-card-section class="q-pa-md text-center">
          <div id="reader" style="width: 100%; min-height: 280px;"></div>
          <div class="text-caption text-grey-7 q-mt-sm">
            Apunta la cámara al código QR o código de barras del empaque Nice
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Diálogo: Comprobante / Ticket de Venta y Apartado -->
    <q-dialog v-model="mostrarModalTicket" persistent>
      <q-card style="min-width: 340px; max-width: 480px; border-radius: 20px;" class="overflow-hidden bg-white">
        <q-card-section class="gradient-navy text-white text-center q-py-md">
          <q-icon name="diamond" size="36px" color="secondary" class="q-mb-xs" />
          <div class="text-h6 brand-font text-gold">
            {{ ticketVenta?.TipoVenta === 'APARTADO' ? 'Apartado Registrado' : '¡Venta Exitosa!' }}
          </div>
          <div class="text-caption text-grey-4">
            Folio: #{{ ticketVenta?.Folio }} • {{ formatFechaHora(ticketVenta?.Fecha) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pa-md">
          <!-- Datos de Cliente y Empresaria -->
          <div class="bg-grey-1 q-pa-sm rounded-borders q-mb-sm text-caption text-grey-8">
            <div class="row justify-between">
              <span>Cliente:</span>
              <strong class="text-primary">{{ ticketVenta?.Cliente ? ticketVenta.Cliente.Nombre : 'Venta General / Mostrador' }}</strong>
            </div>
            <div v-if="ticketVenta?.empresaria" class="row justify-between q-mt-xs">
              <span>Distribuidora:</span>
              <strong class="text-secondary">{{ ticketVenta.empresaria.Nombre }}</strong>
            </div>
          </div>

          <!-- Lista de Artículos -->
          <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">Artículos:</div>
          <q-list dense separator class="border-light rounded-borders q-mb-md" style="max-height: 180px; overflow-y: auto;">
            <q-item v-for="item in ticketVenta?.items" :key="item.id">
              <q-item-section>
                <q-item-label class="text-weight-bold text-primary ellipsis">{{ item.Nombre }}</q-item-label>
                <q-item-label caption>{{ item.cantidad }} x ${{ formatPrecio(item.Precio) }}</q-item-label>
              </q-item-section>
              <q-item-section side class="text-weight-bolder text-primary">
                ${{ formatPrecio(item.cantidad * item.Precio) }}
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Resumen de Pagos -->
          <div class="bg-grey-2 q-pa-sm rounded-borders q-mb-md">
            <div class="row justify-between text-subtitle1 text-weight-bold text-primary">
              <span>Total de la Venta:</span>
              <span>${{ formatPrecio(ticketVenta?.total) }}</span>
            </div>
            <div v-if="ticketVenta?.TipoVenta === 'APARTADO'" class="row justify-between text-body2 text-positive q-mt-xs">
              <span>Enganche / Abono:</span>
              <span class="text-weight-bold">+${{ formatPrecio(ticketVenta?.abonoInicial) }}</span>
            </div>
            <div v-if="ticketVenta?.TipoVenta === 'APARTADO'" class="row justify-between text-subtitle2 text-weight-bolder text-warning q-mt-xs border-top q-pt-xs">
              <span>Saldo Pendiente:</span>
              <span>${{ formatPrecio(ticketVenta?.saldoPendiente) }}</span>
            </div>
          </div>

          <!-- Campo para WhatsApp -->
          <div class="q-mb-sm">
            <label class="text-caption text-weight-bold text-grey-8">WhatsApp del Cliente:</label>
            <q-input
              v-model="telefonoEnvioTicket"
              dense
              outlined
              placeholder="Número de WhatsApp (ej. 5512345678)"
              class="q-mt-xs"
            >
              <template #prepend><q-icon name="phone" color="primary" /></template>
            </q-input>
          </div>
        </q-card-section>

        <!-- Botones de Acción -->
        <q-card-actions align="center" class="q-pa-md q-pt-none column q-gutter-y-xs">
          <q-btn
            unelevated
            class="full-width text-weight-bold bg-positive text-white q-py-sm"
            icon="chat"
            label="Enviar Ticket por WhatsApp"
            @click="compartirTicketWhatsApp"
          />
          <div class="row q-gutter-x-xs full-width q-mt-xs">
            <q-btn
              outline
              color="primary"
              icon="print"
              label="Imprimir"
              class="col text-weight-bold"
              @click="imprimirTicket"
            />
            <q-btn
              unelevated
              color="primary"
              label="Nueva Venta"
              class="col text-weight-bold"
              v-close-popup
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import db from '../db/index.js';
import api from '../services/api.js';
import { usePosStore } from '../stores/posStore.js';
import { useEmpresariaStore } from '../stores/empresariaStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { useNetworkStore } from '../stores/networkStore.js';
import { formatImagenUrl } from '../utils/imageUrl.js';
import { Html5Qrcode } from 'html5-qrcode';

const $q = useQuasar();
const posStore = usePosStore();
const empresariaStore = useEmpresariaStore();
const authStore = useAuthStore();
const networkStore = useNetworkStore();

const productos = ref([]);
const clientes = ref([]);
const filtroBusqueda = ref('');
const categoriaSeleccionada = ref('Todos');
const categorias = ref(['Todos', 'Collares', 'Aretes', 'Pulseras', 'Anillos', 'Dijes', 'Relojes', 'Accesorios']);

const mostrarDialogoCliente = ref(false);
const busquedaCliente = ref('');
const nuevoCliente = ref({ Nombre: '', Telefono: '', Nota: '' });

// Ticket y WhatsApp
const mostrarModalTicket = ref(false);
const ticketVenta = ref(null);
const telefonoEnvioTicket = ref('');

const mostrarScanner = ref(false);
let html5QrCode = null;

// Cargar catálogo local y stock actualizado
async function cargarCatalogoLocal() {
  try {
    const empId = empresariaStore.empresariaActiva?.IdEmpresaria || authStore.usuario?.IdEmpresaria || 2;
    if (networkStore.isOnline) {
      try {
        const [respStock, respClientes] = await Promise.all([
          api.get(`/inventario/stock/${empId}`),
          api.get('/clientes')
        ]);

        if (respStock.data && respStock.data.success && Array.isArray(respStock.data.data)) {
          const rawData = respStock.data.data;
          const prods = rawData.map((p) => ({
            id: String(p.id || p.ProductoId).trim(),
            sku: p.sku,
            CodigoQr: p.CodigoQr || p.sku,
            Nombre: p.Nombre,
            Categoria: p.Categoria,
            Catalogo: p.Catalogo,
            Precio: Number(p.Precio),
            PrecioCosto: Number(p.PrecioCosto || 0),
            ImgURL: p.ImgURL,
            Stock: Number(p.Stock || 0)
          }));

          productos.value = prods;

          // Guardar en Dexie
          await db.productos.bulkPut(prods);
          const stockItems = prods.map((p) => ({
            EmpresariaId: Number(empId),
            ProductoId: p.id,
            Stock: Number(p.Stock),
            updated_at: new Date().toISOString()
          }));
          await db.stock_empresarias.bulkPut(stockItems);
        }

        if (respClientes.data && respClientes.data.success && Array.isArray(respClientes.data.data)) {
          clientes.value = respClientes.data.data;
          await db.clientes.bulkPut(respClientes.data.data);
        }
        return;
      } catch (apiErr) {
        console.warn('Fallback a Dexie para catálogo/clientes:', apiErr.message);
      }
    }

    productos.value = await db.obtenerCatalogoConStock(empId);
    clientes.value = await db.clientes.toArray();
  } catch (err) {
    console.error('Error cargando datos locales:', err);
  }
}

watch(
  () => empresariaStore.empresariaActiva?.IdEmpresaria,
  (newId) => {
    if (newId) {
      cargarCatalogoLocal();
    }
  }
);

// Filtro reactivo de productos
const productosFiltrados = computed(() => {
  return productos.value.filter((p) => {
    const matchCat =
      categoriaSeleccionada.value === 'Todos' ||
      p.Categoria?.toLowerCase() === categoriaSeleccionada.value.toLowerCase();

    if (!matchCat) return false;

    if (!filtroBusqueda.value) return true;
    const query = filtroBusqueda.value.toLowerCase();
    return (
      p.Nombre?.toLowerCase().includes(query) ||
      p.id?.toLowerCase().includes(query) ||
      p.CodigoQr?.toLowerCase().includes(query)
    );
  });
});

// Paginación para catálogo de productos
const paginaActualGrid = ref(1);
const porPaginaGrid = ref(12);

const maxPaginasGrid = computed(() => {
  return Math.ceil(productosFiltrados.value.length / porPaginaGrid.value) || 1;
});

const productosPaginadosGrid = computed(() => {
  const start = (paginaActualGrid.value - 1) * porPaginaGrid.value;
  return productosFiltrados.value.slice(start, start + porPaginaGrid.value);
});

const inicioRegistroGrid = computed(() => {
  if (productosFiltrados.value.length === 0) return 0;
  return (paginaActualGrid.value - 1) * porPaginaGrid.value + 1;
});

const finRegistroGrid = computed(() => {
  return Math.min(
    paginaActualGrid.value * porPaginaGrid.value,
    productosFiltrados.value.length
  );
});

// Al cambiar filtros o selector de elementos por página, volver a la página 1
watch([filtroBusqueda, categoriaSeleccionada, porPaginaGrid], () => {
  paginaActualGrid.value = 1;
});

// Si la cantidad de páginas disminuye por debajo de la actual, ajustar
watch(maxPaginasGrid, (newMax) => {
  if (paginaActualGrid.value > newMax) {
    paginaActualGrid.value = newMax;
  }
});

// Filtro de clientes
const clientesFiltrados = computed(() => {
  if (!busquedaCliente.value) return clientes.value;
  const q = busquedaCliente.value.toLowerCase();
  return clientes.value.filter(
    (c) => c.Nombre?.toLowerCase().includes(q) || c.Telefono?.includes(q)
  );
});

function formatPrecio(val) {
  return Number(val || 0).toFixed(2);
}

function agregarAlCarrito(producto) {
  posStore.agregarProducto(producto, 1);
  $q.notify({
    type: 'positive',
    message: `${producto.Nombre} añadido`,
    position: 'bottom-right',
    timeout: 1000
  });
}

function seleccionarCliente(cliente) {
  posStore.clienteSeleccionado = cliente;
  mostrarDialogoCliente.value = false;
}

async function crearYAsignarCliente() {
  if (!nuevoCliente.value.Nombre || nuevoCliente.value.Nombre.trim() === '') {
    $q.notify({ type: 'warning', message: 'El nombre es obligatorio' });
    return;
  }

  const nuevo = {
    Nombre: nuevoCliente.value.Nombre.trim(),
    Telefono: nuevoCliente.value.Telefono?.trim() || null,
    localOnly: 1
  };

  const id = await db.clientes.add(nuevo);
  nuevo.IdCliente = id;
  clientes.value.push(nuevo);
  seleccionarCliente(nuevo);
  nuevoCliente.value = { Nombre: '', Telefono: '', Nota: '' };
}

async function confirmarCobro() {
  try {
    $q.loading.show({ message: 'Procesando venta...' });
    const venta = await posStore.procesarVenta();
    $q.loading.hide();

    // Actualizar catálogo local de stock
    await cargarCatalogoLocal();

    ticketVenta.value = venta;
    telefonoEnvioTicket.value = venta.Cliente?.Telefono || '';
    mostrarModalTicket.value = true;
  } catch (err) {
    $q.loading.hide();
    $q.notify({ type: 'negative', message: err.message || 'Error al cobrar la venta' });
  }
}

function formatFechaHora(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function compartirTicketWhatsApp() {
  if (!ticketVenta.value) return;
  const v = ticketVenta.value;
  const fechaStr = formatFechaHora(v.Fecha);

  const itemsStr = v.items
    .map(
      (i) =>
        `• ${i.cantidad}x ${i.Nombre} ($${Number(i.Precio).toFixed(2)}) = $${(i.cantidad * i.Precio).toFixed(2)}`
    )
    .join('\n');

  const titulo =
    v.TipoVenta === 'APARTADO'
      ? '💎 *COMPROBANTE DE APARTADO NICE* 💎'
      : '💎 *COMPROBANTE DE VENTA NICE* 💎';

  let msg =
    `${titulo}\n` +
    `📅 *Fecha:* ${fechaStr}\n` +
    `🧾 *Folio:* #${v.Folio}\n` +
    (v.empresaria ? `👩‍💼 *Distribuidora:* ${v.empresaria.Nombre}\n` : '') +
    `👤 *Cliente:* ${v.Cliente ? v.Cliente.Nombre : 'Venta General / Mostrador'}\n` +
    `--------------------------------\n` +
    `🛍️ *DETALLE DE JOYAS:*\n${itemsStr}\n` +
    `--------------------------------\n` +
    `💰 *TOTAL:* $${Number(v.total).toFixed(2)}\n`;

  if (v.TipoVenta === 'APARTADO') {
    msg +=
      `💵 *Enganche / Abono:* $${Number(v.abonoInicial).toFixed(2)}\n` +
      `⚠️ *SALDO PENDIENTE:* $${Number(v.saldoPendiente).toFixed(2)}\n`;
  } else {
    msg += `💵 *Pagado:* $${Number(v.total).toFixed(2)} (${v.MetodoPago || 'Efectivo'})\n`;
  }

  msg +=
    `--------------------------------\n` +
    `¡Muchas gracias por tu preferencia en Joyería Nice! 💍✨`;

  const encoded = encodeURIComponent(msg);
  const telLimpio = String(telefonoEnvioTicket.value || '').replace(/\D/g, '');

  const url = telLimpio
    ? `https://wa.me/${telLimpio.length === 10 ? '52' + telLimpio : telLimpio}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(url, '_blank');
}

function imprimirTicket() {
  window.print();
}

// Manejo del Escáner QR con html5-qrcode
async function abrirEscanerQR() {
  mostrarScanner.value = true;
  await nextTick();

  html5QrCode = new Html5Qrcode('reader');
  try {
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        const texto = String(decodedText).trim()
        let parsedInfo = null
        let skuExtraido = null
        let codigoPieza = null

        // 1. Limpiar URL y extraer segmentos
        const urlLimpia = texto.replace(/^https?:\/\//i, '').split('?')[0].split('#')[0]
        const partes = urlLimpia.split('/').filter(Boolean)

        if (!texto.startsWith('{')) {
          const tieneDominio = partes.length > 0 && (partes[0].includes('.') || partes[0].includes(':'))
          const segmentos = tieneDominio ? partes.slice(1) : partes

          if (segmentos.length >= 2) {
            skuExtraido = segmentos[0]
            codigoPieza = segmentos[1] // ID / Código de pieza
          } else if (segmentos.length === 1) {
            skuExtraido = segmentos[0]
          }
        } else {
          try {
            parsedInfo = JSON.parse(texto)
          } catch {
            parsedInfo = null
          }
        }

        // 2. Extraer el ID / Código de la pieza
        const piezaDetectada =
          codigoPieza || parsedInfo?.codigoPieza || parsedInfo?.codigo_pieza || parsedInfo?.id || parsedInfo?.CodigoQr || ''
        const skuBuscado = skuExtraido || parsedInfo?.sku || texto

        // Priorizar el código de la pieza como el ID a buscar
        const idBuscado = piezaDetectada || skuBuscado || texto

        // 3. Buscar coincidencia por ID (código de pieza), SKU o CódigoQr
        const encontrado = productos.value.find(
          (p) =>
            String(p.id)?.toLowerCase() === idBuscado.toLowerCase() ||
            String(p.codigoPieza || p.codigo_pieza)?.toLowerCase() === idBuscado.toLowerCase() ||
            String(p.sku)?.toLowerCase() === idBuscado.toLowerCase()
        )

        if (encontrado) {
          agregarAlCarrito(encontrado)
          cerrarEscaner()
        } else {
          $q.notify({
            type: 'warning',
            message: `Pieza ID "${idBuscado}" no registrada en el catálogo local.`,
            position: 'top',
            timeout: 3000
          })
        }
      },
      () => {}
    );
  } catch (err) {
    console.warn('Error iniciando cámara:', err);
    $q.notify({
      type: 'negative',
      message: 'No se pudo acceder a la cámara. Revisa los permisos en la tablet.'
    });
    mostrarScanner.value = false;
  }
}

function cerrarEscaner() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      mostrarScanner.value = false;
    }).catch(() => {
      mostrarScanner.value = false;
    });
  } else {
    mostrarScanner.value = false;
  }
}

onMounted(() => {
  cargarCatalogoLocal();
});
</script>

<style scoped>
.border-light {
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.border-top {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
