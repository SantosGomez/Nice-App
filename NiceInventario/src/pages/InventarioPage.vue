<template>
  <q-page class="q-pa-md bg-grey-1">
    <!-- Encabezado y Estadísticas de Inventario -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-8">
        <div class="row items-center justify-between">
          <div>
            <div class="text-h5 text-weight-bolder text-primary brand-font">
              Catálogo e Inventario
            </div>
            <div class="text-caption text-grey-7">
              Distribuidora: <span class="text-weight-bold text-primary">{{ empresariaStore.empresariaActiva?.Nombre }}</span> • Descuento: <span class="text-weight-bold text-secondary">{{ empresariaStore.descuentoActivo }}%</span>
            </div>
          </div>

          <div class="row q-gutter-sm q-mt-xs-sm">
            <!-- Botón Escanear QR con Cámara -->
            <q-btn
              unelevated
              rounded
              color="primary"
              icon="qr_code_scanner"
              label="Escanear QR"
              class="text-weight-bold shadow-1"
              @click="abrirEscanerQR"
            />
            <q-btn
              unelevated
              rounded
              color="secondary"
              text-color="primary"
              icon="add_circle"
              label="Entrada de Stock"
              class="text-weight-bold"
              @click="abrirModalEntrada"
            />
            <q-btn
              outline
              rounded
              color="primary"
              icon="diamond"
              label="Nueva Joya"
              class="text-weight-bold"
              @click="abrirModalNuevoManual"
            />
          </div>
        </div>
      </div>

      <!-- Métricas Rápidas en Tarjetas -->
      <div class="col-12 col-md-4">
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-card flat class="bg-white rounded-borders shadow-1 q-pa-sm text-center">
              <div class="text-caption text-grey-6">Modelos</div>
              <div class="text-h6 text-weight-bolder text-primary">{{ productos.length }}</div>
            </q-card>
          </div>
          <div class="col-6">
            <q-card flat class="bg-white rounded-borders shadow-1 q-pa-sm text-center">
              <div class="text-caption text-grey-6">Piezas en Stock</div>
              <div class="text-h6 text-weight-bolder text-positive">{{ totalPiezasStock }}</div>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <q-card flat class="rounded-borders shadow-1 q-mb-md bg-white">
      <q-card-section class="q-pb-sm">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-12 col-sm-6 col-md-8">
            <q-input
              v-model="filtroBusqueda"
              dense
              outlined
              rounded
              clearable
              placeholder="Buscar por Nombre, SKU o Código QR..."
              class="bg-grey-1"
            >
              <template #prepend><q-icon name="search" color="primary" /></template>
              <template #append>
                <q-btn
                  flat
                  round
                  dense
                  icon="qr_code_scanner"
                  color="primary"
                  @click="abrirEscanerQR"
                >
                  <q-tooltip>Escanear código con la cámara</q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-md-4 row justify-end q-gutter-xs">
            <q-btn-toggle
              v-model="vistaModo"
              dense
              rounded
              toggle-color="primary"
              color="grey-2"
              text-color="grey-8"
              :options="[
                { icon: 'grid_view', value: 'grid' },
                { icon: 'view_list', value: 'table' }
              ]"
            />
          </div>
        </div>

        <!-- Filtro por Categorías -->
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

    <!-- Vista Cuadrícula (Grid) -->
    <div v-if="vistaModo === 'grid' && productosFiltrados.length > 0" class="row q-col-gutter-sm">
      <div
        v-for="prod in productosFiltrados"
        :key="prod.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card flat class="rounded-borders shadow-1 bg-white column full-height">
          <div class="relative-position bg-grey-2 text-center q-pa-sm" style="height: 140px;">
            <q-img
              v-if="prod.ImgURL"
              :src="prod.ImgURL"
              fit="contain"
              class="full-height rounded-borders"
            />
            <div v-else class="column items-center justify-center full-height text-grey-5">
              <q-icon name="diamond" size="48px" color="secondary" />
              <span class="text-caption">Joyería Nice</span>
            </div>

            <!-- Badge de Stock -->
            <q-badge
              :color="prod.Stock > 0 ? 'positive' : 'negative'"
              class="absolute-top-right q-ma-xs text-weight-bold"
            >
              {{ prod.Stock > 0 ? `${prod.Stock} en stock` : 'Agotado' }}
            </q-badge>
          </div>

          <q-card-section class="q-pa-sm col column justify-between">
            <div>
              <div class="text-caption text-grey-6">SKU: {{ prod.sku }} • {{ prod.Categoria }}</div>
              <div class="text-weight-bold text-subtitle2 text-primary line-clamp-2">
                {{ prod.Nombre }}
              </div>
            </div>

            <div class="q-mt-xs">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-caption text-grey-6">P. Catálogo:</div>
                  <div class="text-h6 text-weight-bolder text-primary">
                    ${{ formatPrecio(prod.Precio) }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-caption text-grey-6">Costo ({{ empresariaStore.descuentoActivo }}%):</div>
                  <div class="text-caption text-weight-bold text-secondary">
                    ${{ formatPrecio(prod.Precio * (1 - empresariaStore.descuentoActivo / 100)) }}
                  </div>
                </div>
              </div>

              <!-- Botón Rápido de Ajuste de Stock -->
              <div class="row q-gutter-xs q-mt-sm">
                <q-btn
                  outline
                  dense
                  size="sm"
                  color="primary"
                  label="Entrada"
                  icon="add"
                  class="col text-weight-bold"
                  @click="abrirEntradaRapida(prod)"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Vista Tabla -->
    <q-card v-else-if="vistaModo === 'table' && productosFiltrados.length > 0" flat class="rounded-borders shadow-1 bg-white">
      <q-table
        :rows="productosFiltrados"
        :columns="columnasTabla"
        row-key="id"
        flat
        bordered
        :pagination="{ rowsPerPage: 15 }"
      >
        <template #body-cell-Stock="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.Stock > 0 ? 'positive' : 'negative'"
              class="text-weight-bold q-pa-xs"
            >
              {{ props.row.Stock }} piezas
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-Acciones="props">
          <q-td :props="props" class="text-right">
            <q-btn
              round
              dense
              flat
              color="secondary"
              icon="add_circle"
              size="sm"
              @click="abrirEntradaRapida(props.row)"
            >
              <q-tooltip>Agregar Stock</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Estado Vacío -->
    <div v-else class="text-center q-pa-xl text-grey-6">
      <q-icon name="inventory_2" size="64px" color="grey-4" />
      <div class="text-h6 q-mt-sm">No se encontraron joyas en el inventario</div>
      <div class="text-caption">Registra una nueva joya o sincroniza el catálogo desde la nube</div>
    </div>

    <!-- Diálogo: Escáner QR con Cámara -->
    <q-dialog v-model="mostrarScanner" persistent @hide="cerrarEscaner">
      <q-card style="width: 100%; max-width: 440px; border-radius: 20px;" class="overflow-hidden">
        <q-card-section class="gradient-navy text-white row items-center q-py-sm">
          <div class="row items-center q-gutter-x-xs">
            <q-icon name="qr_code_scanner" size="24px" color="gold" />
            <div class="text-subtitle1 text-weight-bold text-gold brand-font">
              Escanear Joya Nice (QR / Código)
            </div>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md text-center bg-grey-1">
          <div class="text-caption text-grey-7 q-mb-sm">
            Apunta la cámara a la etiqueta de la joya. El sistema autocompletará el formulario correspondiente:
          </div>

          <!-- Contenedor del visor de cámara -->
          <div id="reader-inventario" class="scanner-box rounded-borders shadow-2 bg-black"></div>

          <div class="row q-gutter-x-sm justify-center q-mt-md">
            <q-btn
              outline
              rounded
              dense
              color="primary"
              icon="close"
              label="Cancelar"
              class="q-px-md text-weight-bold"
              v-close-popup
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Modal: Registrar Entrada de Inventario (QR / Manual) -->
    <q-dialog v-model="mostrarModalEntrada">
      <q-card style="min-width: 340px; max-width: 500px; border-radius: 16px;">
        <q-card-section class="gradient-navy text-white row items-center">
          <div class="row items-center q-gutter-x-xs">
            <q-icon name="inventory" color="gold" size="22px" />
            <div class="text-h6 brand-font text-gold">Registrar Entrada de Stock</div>
          </div>
          <q-space />
          <q-btn
            flat
            round
            dense
            icon="qr_code_scanner"
            color="amber-3"
            class="q-mr-xs"
            @click="abrirEscanerDesdeEntrada"
          >
            <q-tooltip>Escanear con cámara</q-tooltip>
          </q-btn>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="q-mb-sm">
            <label class="text-caption text-weight-bold text-grey-8">Seleccionar Joya:</label>
            <q-select
              v-model="entradaData.producto"
              :options="productos"
              option-label="Nombre"
              option-value="id"
              dense
              outlined
              use-input
              input-debounce="0"
              placeholder="Escribe el nombre o SKU..."
              class="q-mt-xs"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.Nombre }}</q-item-label>
                    <q-item-label caption>SKU: {{ scope.opt.sku }} • Stock actual: {{ scope.opt.Stock }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6">
              <label class="text-caption text-weight-bold text-grey-8">Cantidad a ingresar:</label>
              <q-input
                v-model.number="entradaData.cantidad"
                type="number"
                dense
                outlined
                min="1"
                class="q-mt-xs"
              />
            </div>
            <div class="col-6">
              <label class="text-caption text-weight-bold text-grey-8">Tipo de Entrada:</label>
              <q-select
                v-model="entradaData.tipo"
                :options="[
                  { label: 'Escaneo QR', value: 'IN_QR' },
                  { label: 'Ingreso Manual', value: 'MANUAL_IN' },
                  { label: 'Ajuste Físico', value: 'ADJUSTMENT' }
                ]"
                emit-value
                map-options
                dense
                outlined
                class="q-mt-xs"
              />
            </div>
          </div>

          <div class="q-mb-md">
            <label class="text-caption text-weight-bold text-grey-8">Notas / Referencia:</label>
            <q-input
              v-model="entradaData.notas"
              dense
              outlined
              placeholder="Ej. Pedido de catálogo campaña..."
              class="q-mt-xs"
            />
          </div>

          <q-btn
            unelevated
            class="full-width gradient-gold text-primary text-weight-bold text-subtitle1 q-py-sm"
            label="CONFIRMAR ENTRADA"
            :disable="!entradaData.producto || entradaData.cantidad <= 0"
            @click="guardarEntradaStock"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Modal: Registrar Nueva Joya -->
    <q-dialog v-model="mostrarModalNuevo">
      <q-card style="min-width: 340px; max-width: 550px; border-radius: 16px;">
        <q-card-section class="gradient-navy text-white row items-center">
          <div class="row items-center q-gutter-x-xs">
            <q-icon name="diamond" color="gold" size="22px" />
            <div class="text-h6 brand-font text-gold">Nueva Joya en Catálogo</div>
          </div>
          <q-space />
          <q-btn
            flat
            round
            dense
            icon="qr_code_scanner"
            color="amber-3"
            class="q-mr-xs"
            @click="abrirEscanerDesdeNuevo"
          >
            <q-tooltip>Llenar datos escaneando QR</q-tooltip>
          </q-btn>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input v-model="nuevoProducto.id" dense outlined label="ID Único / Código *" placeholder="Ej. NICE-001" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="nuevoProducto.sku" dense outlined label="SKU de Joya *" placeholder="Ej. 123456" />
            </div>
            <div class="col-12">
              <q-input v-model="nuevoProducto.Nombre" dense outlined label="Nombre de la Joya *" placeholder="Ej. Aretes Baño de Oro 18K Cristal" />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="nuevoProducto.Categoria"
                :options="['Collares', 'Aretes', 'Pulseras', 'Anillos', 'Dijes', 'Relojes', 'Accesorios']"
                dense
                outlined
                label="Categoría *"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="nuevoProducto.Catalogo" dense outlined label="Catálogo / Colección *" placeholder="Ej. Nice 2026" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model.number="nuevoProducto.Precio" type="number" dense outlined prefix="$" label="Precio Catálogo *" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model.number="nuevoProducto.StockInicial" type="number" dense outlined label="Stock Inicial" />
            </div>
            <div class="col-12">
              <q-input v-model="nuevoProducto.ImgURL" dense outlined label="URL de Imagen (Opcional)" placeholder="https://..." />
            </div>
          </div>

          <q-btn
            unelevated
            color="primary"
            label="Guardar Joya"
            class="full-width q-mt-md text-weight-bold"
            @click="guardarNuevoProducto"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { Html5Qrcode } from 'html5-qrcode';
import db from '../db/index.js';
import api from '../services/api.js';
import { useEmpresariaStore } from '../stores/empresariaStore.js';
import { useNetworkStore } from '../stores/networkStore.js';

const $q = useQuasar();
const empresariaStore = useEmpresariaStore();
const networkStore = useNetworkStore();

const productos = ref([]);
const filtroBusqueda = ref('');
const categoriaSeleccionada = ref('Todos');
const categorias = ref(['Todos', 'Collares', 'Aretes', 'Pulseras', 'Anillos', 'Dijes', 'Relojes', 'Accesorios']);
const vistaModo = ref('grid');

// Modales
const mostrarModalEntrada = ref(false);
const mostrarModalNuevo = ref(false);
const mostrarScanner = ref(false);

let html5QrCode = null;

const entradaData = ref({
  producto: null,
  cantidad: 1,
  tipo: 'IN_QR',
  notas: ''
});

const nuevoProducto = ref({
  id: '',
  sku: '',
  Nombre: '',
  Categoria: 'Collares',
  Catalogo: 'Nice 2026',
  Precio: 0,
  StockInicial: 1,
  ImgURL: ''
});

const columnasTabla = [
  { name: 'sku', label: 'SKU', field: 'sku', align: 'left', sortable: true },
  { name: 'Nombre', label: 'Nombre', field: 'Nombre', align: 'left', sortable: true },
  { name: 'Categoria', label: 'Categoría', field: 'Categoria', align: 'left' },
  { name: 'Catalogo', label: 'Catálogo', field: 'Catalogo', align: 'left' },
  { name: 'Precio', label: 'Precio', field: (row) => `$${Number(row.Precio).toFixed(2)}`, align: 'right', sortable: true },
  { name: 'Stock', label: 'Stock', field: 'Stock', align: 'center', sortable: true },
  { name: 'Acciones', label: 'Acciones', align: 'right' }
];

async function cargarInventario() {
  try {
    const empId = empresariaStore.empresariaActiva?.IdEmpresaria || 1;
    productos.value = await db.obtenerCatalogoConStock(empId);
  } catch (err) {
    console.error('Error cargando inventario:', err);
  }
}

const productosFiltrados = computed(() => {
  return productos.value.filter((p) => {
    const matchCat =
      categoriaSeleccionada.value === 'Todos' ||
      p.Categoria?.toLowerCase() === categoriaSeleccionada.value.toLowerCase();
    if (!matchCat) return false;

    if (!filtroBusqueda.value) return true;
    const q = filtroBusqueda.value.toLowerCase();
    return (
      p.Nombre?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.CodigoQr?.toLowerCase().includes(q)
    );
  });
});

const totalPiezasStock = computed(() => {
  return productos.value.reduce((acc, p) => acc + (Number(p.Stock) || 0), 0);
});

function formatPrecio(val) {
  return Number(val || 0).toFixed(2);
}

function abrirModalEntrada() {
  entradaData.value = {
    producto: productos.value[0] || null,
    cantidad: 1,
    tipo: 'MANUAL_IN',
    notas: ''
  };
  mostrarModalEntrada.value = true;
}

function abrirModalNuevoManual() {
  nuevoProducto.value = {
    id: '',
    sku: '',
    Nombre: '',
    Categoria: 'Collares',
    Catalogo: 'Nice 2026',
    Precio: 0,
    StockInicial: 1,
    ImgURL: ''
  };
  mostrarModalNuevo.value = true;
}

function abrirEntradaRapida(prod) {
  entradaData.value = {
    producto: prod,
    cantidad: 1,
    tipo: 'MANUAL_IN',
    notas: 'Entrada rápida desde catálogo'
  };
  mostrarModalEntrada.value = true;
}

function abrirEscanerDesdeEntrada() {
  mostrarModalEntrada.value = false;
  abrirEscanerQR();
}

function abrirEscanerDesdeNuevo() {
  mostrarModalNuevo.value = false;
  abrirEscanerQR();
}

/**
 * Inicia el escáner de cámara para leer códigos QR de joyas Nice.
 */
async function abrirEscanerQR() {
  mostrarScanner.value = true;
  await nextTick();

  try {
    html5QrCode = new Html5Qrcode('reader-inventario');
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => {
        procesarLecturaQR(decodedText);
      },
      () => {
        // Errores menores por cuadro vacío ignorados
      }
    );
  } catch (err) {
    console.error('Error al iniciar cámara QR:', err);
    $q.notify({
      type: 'negative',
      message: 'No se pudo acceder a la cámara: ' + (err.message || err)
    });
    mostrarScanner.value = false;
  }
}

/**
 * Procesa la información del QR:
 * - NO inserta ni actualiza en automático.
 * - Si la joya existe -> abre modal de Entrada de Stock con el producto seleccionado.
 * - Si es nueva -> abre modal de Nueva Joya con los campos prellenados.
 */
async function procesarLecturaQR(decodedText) {
  await cerrarEscaner();

  const texto = String(decodedText).trim();
  let parsedInfo = null;

  // 1. Intentar parsear como JSON si el QR contiene un payload estructurado
  try {
    parsedInfo = JSON.parse(texto);
  } catch {
    parsedInfo = null;
  }

  const skuBuscado = (parsedInfo && (parsedInfo.sku || parsedInfo.id || parsedInfo.CodigoQr)) || texto;

  // 2. Buscar si ya existe en el catálogo local
  const encontrado = productos.value.find(
    (p) =>
      p.sku?.toLowerCase() === skuBuscado.toLowerCase() ||
      p.CodigoQr?.toLowerCase() === skuBuscado.toLowerCase() ||
      p.id?.toLowerCase() === skuBuscado.toLowerCase()
  );

  if (encontrado) {
    // CASO A: Joya existente -> Preparar formulario de Entrada de Stock
    entradaData.value = {
      producto: encontrado,
      cantidad: 1,
      tipo: 'IN_QR',
      notas: `Entrada escaneada por QR (${skuBuscado})`
    };

    $q.notify({
      type: 'positive',
      icon: 'qr_code_2',
      message: `Joya identificada: "${encontrado.Nombre}". Ajusta la cantidad y confirma la entrada.`,
      position: 'top',
      timeout: 3000
    });

    mostrarModalEntrada.value = true;
  } else {
    // CASO B: Joya Nueva -> Preparar formulario para agregar nueva pieza
    nuevoProducto.value = {
      id: parsedInfo?.id || skuBuscado,
      sku: parsedInfo?.sku || skuBuscado,
      Nombre: parsedInfo?.Nombre || parsedInfo?.nombre || '',
      Categoria: parsedInfo?.Categoria || parsedInfo?.categoria || 'Collares',
      Catalogo: parsedInfo?.Catalogo || parsedInfo?.catalogo || 'Nice 2026',
      Precio: Number(parsedInfo?.Precio || parsedInfo?.precio || 0),
      StockInicial: Number(parsedInfo?.StockInicial || parsedInfo?.cantidad || 1),
      ImgURL: parsedInfo?.ImgURL || parsedInfo?.imgUrl || ''
    };

    $q.notify({
      type: 'info',
      icon: 'auto_awesome',
      message: `Código detectado: "${skuBuscado}". Formulario listo para registrar la nueva joya.`,
      position: 'top',
      timeout: 3500
    });

    mostrarModalNuevo.value = true;
  }
}

async function cerrarEscaner() {
  if (html5QrCode) {
    try {
      if (html5QrCode.isScanning) {
        await html5QrCode.stop();
      }
      await html5QrCode.clear();
    } catch (e) {
      console.warn('Deteniendo scanner:', e);
    }
    html5QrCode = null;
  }
  mostrarScanner.value = false;
}

async function guardarEntradaStock() {
  try {
    const { producto, cantidad, tipo, notas } = entradaData.value;
    const empId = empresariaStore.empresariaActiva?.IdEmpresaria || 1;

    // Actualizar en Dexie
    const stockRecord = await db.stock_empresarias.get([empId, producto.id]);
    const stockActual = stockRecord ? stockRecord.Stock : 0;
    const nuevoStock = stockActual + Number(cantidad);

    await db.stock_empresarias.put({
      EmpresariaId: empId,
      ProductoId: producto.id,
      Stock: nuevoStock,
      updated_at: new Date().toISOString()
    });

    await db.inventory_movements.add({
      ProductoId: producto.id,
      EmpresariaId: empId,
      tipo,
      Quantity: Number(cantidad),
      Notas: notas || 'Entrada registrada en tablet',
      created_at: new Date().toISOString()
    });

    // Si hay conexión, enviar al backend
    if (networkStore.isOnline) {
      api.post('/inventario/movimiento', {
        ProductoId: producto.id,
        EmpresariaId: empId,
        tipo,
        Quantity: Number(cantidad),
        Notas: notas
      }).catch((e) => console.warn('[Inventario] Sincronización backend en cola:', e.message));
    }

    $q.notify({
      type: 'positive',
      icon: 'done_all',
      message: `+${cantidad} piezas agregadas a ${producto.Nombre}`,
      position: 'top'
    });

    mostrarModalEntrada.value = false;
    await cargarInventario();
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Error al registrar entrada: ' + err.message });
  }
}

async function guardarNuevoProducto() {
  try {
    const p = nuevoProducto.value;
    if (!p.id || !p.sku || !p.Nombre || !p.Precio) {
      $q.notify({ type: 'warning', message: 'Completa los campos obligatorios (*)' });
      return;
    }

    const empId = empresariaStore.empresariaActiva?.IdEmpresaria || 1;
    const prodObj = {
      id: p.id.trim(),
      sku: p.sku.trim(),
      CodigoQr: p.sku.trim(),
      Nombre: p.Nombre.trim(),
      Categoria: p.Categoria,
      Catalogo: p.Catalogo,
      Precio: Number(p.Precio),
      PrecioCosto: Number(p.Precio) * (1 - (empresariaStore.descuentoActivo / 100)),
      ImgURL: p.ImgURL ? p.ImgURL.trim() : null
    };

    // 1. Guardar producto en Dexie
    await db.productos.put(prodObj);

    // 2. Si se asignó stock inicial, guardarlo
    if (Number(p.StockInicial) > 0) {
      await db.stock_empresarias.put({
        EmpresariaId: empId,
        ProductoId: prodObj.id,
        Stock: Number(p.StockInicial),
        updated_at: new Date().toISOString()
      });
    }

    // 3. Si hay red, enviar al backend
    if (networkStore.isOnline) {
      api.post('/productos', prodObj).catch((e) => console.warn('Sync producto nuevo falló:', e.message));
    }

    $q.notify({ type: 'positive', icon: 'diamond', message: 'Joya registrada exitosamente' });
    mostrarModalNuevo.value = false;
    nuevoProducto.value = { id: '', sku: '', Nombre: '', Categoria: 'Collares', Catalogo: 'Nice 2026', Precio: 0, StockInicial: 1, ImgURL: '' };
    await cargarInventario();
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Error al guardar producto: ' + err.message });
  }
}

onMounted(() => {
  cargarInventario();
});

onBeforeUnmount(() => {
  cerrarEscaner();
});
</script>

<style scoped>
.scanner-box {
  width: 100%;
  min-height: 260px;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
