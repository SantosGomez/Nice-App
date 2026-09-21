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
              Distribuidora:
              <span class="text-weight-bold text-primary">{{
                empresariaStore.empresariaActiva?.Nombre
              }}</span>
              • Descuento:
              <span class="text-weight-bold text-secondary"
                >{{ empresariaStore.descuentoActivo }}%</span
              >
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
              placeholder="Buscar por Nombre, Código o Código QR..."
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
                { icon: 'view_list', value: 'table' },
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
    <div v-if="vistaModo === 'grid' && productosFiltrados.length > 0">
      <div class="row q-col-gutter-sm">
        <div
          v-for="prod in productosPaginadosGrid"
          :key="prod.id"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <q-card flat class="rounded-borders shadow-1 bg-white column full-height">
            <div class="relative-position bg-grey-2 text-center q-pa-sm" style="height: 140px">
              <q-img
                v-if="prod.ImgURL"
                :src="formatImagenUrl(prod.ImgURL)"
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
                <div class="text-caption text-grey-6">
                  Código: {{ prod.id }} / Categoría: {{ prod.Categoria }}
                </div>
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
                    <div class="text-caption text-grey-6">
                      Costo ({{ empresariaStore.descuentoActivo }}%):
                    </div>
                    <div class="text-caption text-weight-bold text-secondary">
                      ${{ formatPrecio(prod.Precio * (1 - empresariaStore.descuentoActivo / 100)) }}
                    </div>
                  </div>
                </div>

                <!-- Botones de Acción: Entrada de Stock y Edición -->
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
                  >
                    <q-tooltip>Ingresar piezas al stock</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    size="sm"
                    color="primary"
                    label="Editar"
                    icon="edit"
                    class="col text-weight-bold bg-amber-1"
                    @click="abrirModalEditar(prod)"
                  >
                    <q-tooltip>Editar datos de la joya</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Paginación Vista Cuadrícula -->
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
          :max-pages="6"
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

    <!-- Vista Tabla -->
    <q-card
      v-else-if="vistaModo === 'table' && productosFiltrados.length > 0"
      flat
      class="rounded-borders shadow-1 bg-white"
    >
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
              color="primary"
              icon="edit"
              size="sm"
              class="q-mr-xs"
              @click="abrirModalEditar(props.row)"
            >
              <q-tooltip>Editar Información</q-tooltip>
            </q-btn>
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
      <q-card style="width: 100%; max-width: 440px; border-radius: 20px" class="overflow-hidden">
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
            Apunta la cámara a la etiqueta de la joya. El sistema autocompletará el formulario
            correspondiente:
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

    <!-- Diálogo para Tomar Foto de Producto con Cámara en Vivo -->
    <q-dialog v-model="mostrarModalCamara" persistent @hide="detenerCamaraFoto">
      <q-card style="width: 100%; max-width: 450px; border-radius: 16px">
        <q-card-section class="bg-primary text-white row items-center q-py-sm">
          <div class="text-subtitle1 text-weight-bold">Tomar Foto del Producto</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md text-center bg-black">
          <video
            ref="videoFotoRef"
            autoplay
            playsinline
            style="width: 100%; height: 260px; object-fit: cover; border-radius: 8px"
          ></video>
          <canvas ref="canvasFotoRef" style="display: none"></canvas>
        </q-card-section>

        <q-card-actions align="center" class="q-pa-md bg-grey-2">
          <q-btn
            unelevated
            rounded
            color="primary"
            icon="photo_camera"
            label="Capturar Foto"
            class="text-weight-bold q-px-md"
            @click="capturarFotoDesdeCamara"
          />
          <q-btn flat rounded color="negative" label="Cancelar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal: Registrar Entrada de Inventario (QR / Manual) -->
    <q-dialog v-model="mostrarModalEntrada">
      <q-card style="min-width: 340px; max-width: 500px; border-radius: 16px">
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
                    <q-item-label caption
                      >SKU: {{ scope.opt.sku }} • Stock actual: {{ scope.opt.Stock }}</q-item-label
                    >
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
                  { label: 'Ajuste Físico', value: 'ADJUSTMENT' },
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

    <!-- Modal: Registrar / Editar Joya -->
    <q-dialog v-model="mostrarModalNuevo">
      <q-card style="min-width: 340px; max-width: 550px; border-radius: 16px">
        <q-card-section class="gradient-navy text-white row items-center">
          <div class="row items-center q-gutter-x-xs">
            <q-icon :name="editandoProducto ? 'edit' : 'diamond'" color="gold" size="22px" />
            <div class="text-h6 brand-font text-gold">
              {{ editandoProducto ? 'Editar Información de Joya' : 'Nueva Joya en Catálogo' }}
            </div>
          </div>
          <q-space />
          <q-btn
            v-if="!editandoProducto"
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
              <q-input
                v-model="nuevoProducto.id"
                dense
                outlined
                :disable="editandoProducto"
                label="ID Único / Código *"
                placeholder="Ej. NICE-001"
                :hint="editandoProducto ? 'El ID único no se puede cambiar' : ''"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="nuevoProducto.sku"
                dense
                outlined
                label="SKU de Joya *"
                placeholder="Ej. 123456"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="nuevoProducto.Nombre"
                dense
                outlined
                label="Nombre de la Joya *"
                placeholder="Ej. Aretes Baño de Oro 18K Cristal"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="nuevoProducto.Categoria"
                :options="[
                  'Collares',
                  'Aretes',
                  'Pulseras',
                  'Anillos',
                  'Dijes',
                  'Relojes',
                  'Accesorios',
                ]"
                dense
                outlined
                label="Categoría *"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="nuevoProducto.Catalogo"
                dense
                outlined
                label="Catálogo / Colección *"
                placeholder="Ej. Nice 2026"
              />
            </div>
            <div class="col-12" :class="editandoProducto ? 'col-sm-12' : 'col-sm-6'">
              <q-input
                v-model.number="nuevoProducto.Precio"
                type="number"
                dense
                outlined
                prefix="$"
                label="Precio Catálogo *"
              />
            </div>
            <div v-if="!editandoProducto" class="col-12 col-sm-6">
              <q-input
                v-model.number="nuevoProducto.StockInicial"
                type="number"
                dense
                outlined
                label="Stock Inicial"
              />
            </div>
            <!-- Sección de Imagen de la Joya (Cámara / Galería / URL) -->
            <div :class="editandoProducto ? 'col-sm-12' : 'col-sm-6'">
              <label class="text-caption text-weight-bold text-grey-8">Imagen de la Joya:</label>

              <!-- Vista previa de la foto -->
              <div v-if="nuevoProducto.ImgURL" class="q-mb-sm text-center relative-position">
                <q-img
                  :src="formatImagenUrl(nuevoProducto.ImgURL)"
                  spinner-color="primary"
                  style="height: 140px; max-width: 100%; border-radius: 12px"
                  fit="contain"
                  class="bg-grey-2 shadow-1"
                />
                <q-btn
                  round
                  dense
                  color="negative"
                  icon="close"
                  size="xs"
                  class="absolute-top-right q-ma-xs"
                  @click="nuevoProducto.ImgURL = ''"
                >
                  <q-tooltip>Quitar foto</q-tooltip>
                </q-btn>
              </div>

              <!-- Botones de Acción -->
              <div class="row q-gutter-xs q-mb-xs">
                <q-btn
                  outline
                  dense
                  color="primary"
                  icon="photo_camera"
                  label="Cámara"
                  class="col text-weight-bold"
                  @click="abrirCamaraProducto"
                />
                <q-btn
                  outline
                  dense
                  color="secondary"
                  icon="photo_library"
                  label="Galería"
                  class="col text-weight-bold"
                  @click="abrirGaleriaProducto"
                />
              </div>

              <!-- Input HTML oculto SOLO para GALERÍA -->
              <input
                ref="inputGaleriaRef"
                type="file"
                accept="image/*"
                style="display: none"
                @change="alSeleccionarFotoProducto"
              />

              <!-- Campo opcional para ingresar URL manualmente -->
              <q-input
                v-model="nuevoProducto.ImgURL"
                dense
                outlined
                placeholder="O pega la URL de la imagen (https://...)"
                class="q-mt-xs"
              />
            </div>
          </div>

          <q-btn
            unelevated
            color="primary"
            :label="editandoProducto ? 'Guardar Cambios' : 'Guardar Joya'"
            class="full-width q-mt-md text-weight-bold"
            @click="guardarProducto"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Diálogo: Tomar Foto de la Joya con la Cámara -->
    <q-dialog v-model="mostrarModalCamara" persistent @hide="detenerCamaraFoto">
      <q-card style="width: 100%; max-width: 440px; border-radius: 20px" class="overflow-hidden bg-black text-white">
        <q-card-section class="gradient-navy text-white row items-center justify-between q-py-sm">
          <div class="row items-center q-gutter-x-xs">
            <q-icon name="photo_camera" size="22px" color="gold" />
            <div class="text-subtitle1 text-weight-bold text-gold brand-font">Tomar Foto de Joya</div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-none relative-position flex flex-center" style="min-height: 300px; background: #000;">
          <video
            ref="videoFotoRef"
            autoplay
            playsinline
            muted
            style="width: 100%; max-height: 380px; object-fit: cover;"
          ></video>
          <canvas ref="canvasFotoRef" style="display: none;"></canvas>
        </q-card-section>

        <q-card-actions align="center" class="q-pa-md bg-grey-10">
          <q-btn
            round
            color="primary"
            icon="camera"
            size="lg"
            class="shadow-4"
            @click="capturarFotoDesdeCamara"
          >
            <q-tooltip>Capturar Foto</q-tooltip>
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { Html5Qrcode } from 'html5-qrcode'
import db from '../db/index.js'
import api from '../services/api.js'
import { useEmpresariaStore } from '../stores/empresariaStore.js'
import { useAuthStore } from '../stores/authStore.js'
import { useNetworkStore } from '../stores/networkStore.js'
import { formatImagenUrl } from '../utils/imageUrl.js'

const $q = useQuasar()
const empresariaStore = useEmpresariaStore()
const authStore = useAuthStore()
const networkStore = useNetworkStore()

const productos = ref([])
const filtroBusqueda = ref('')
const categoriaSeleccionada = ref('Todos')
const categorias = ref([
  'Todos',
  'Collares',
  'Aretes',
  'Pulseras',
  'Anillos',
  'Dijes',
  'Relojes',
  'Accesorios',
])
const vistaModo = ref('grid')

// Modales
const mostrarModalEntrada = ref(false)
const mostrarModalNuevo = ref(false)
const mostrarScanner = ref(false)
const editandoProducto = ref(false)

const mostrarModalCamara = ref(false)
const videoFotoRef = ref(null)
const canvasFotoRef = ref(null)
const inputGaleriaRef = ref(null)
let streamCamara = null

let html5QrCode = null

const entradaData = ref({
  producto: null,
  cantidad: 1,
  tipo: 'IN_QR',
  notas: '',
})

const nuevoProducto = ref({
  id: '',
  sku: '',
  Nombre: '',
  Categoria: 'Collares',
  Catalogo: 'Nice 2026',
  Precio: 0,
  StockInicial: 1,
  ImgURL: '',
})

const columnasTabla = [
  { name: 'id', label: 'Código', field: 'id', align: 'left', sortable: true },
  { name: 'Nombre', label: 'Nombre', field: 'Nombre', align: 'left', sortable: true },
  { name: 'Categoria', label: 'Categoría', field: 'Categoria', align: 'left' },
  { name: 'Catalogo', label: 'Catálogo', field: 'Catalogo', align: 'left' },
  {
    name: 'Precio',
    label: 'Precio',
    field: (row) => `$${Number(row.Precio).toFixed(2)}`,
    align: 'right',
    sortable: true,
  },
  { name: 'Stock', label: 'Stock', field: 'Stock', align: 'center', sortable: true },
  { name: 'Acciones', label: 'Acciones', align: 'right' },
]

async function cargarInventario() {
  try {
    const empId =
      empresariaStore.empresariaActiva?.IdEmpresaria || authStore.usuario?.IdEmpresaria || 2
    if (networkStore.isOnline) {
      try {
        const resp = await api.get(`/inventario/stock/${empId}`)
        if (resp.data && resp.data.success && Array.isArray(resp.data.data)) {
          const rawData = resp.data.data
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
            Stock: Number(p.Stock || 0),
          }))

          productos.value = prods

          // Actualizar caché de Dexie en segundo plano
          await db.productos.bulkPut(prods)
          const stockItems = prods.map((p) => ({
            EmpresariaId: Number(empId),
            ProductoId: p.id,
            Stock: Number(p.Stock),
            updated_at: new Date().toISOString(),
          }))
          await db.stock_empresarias.bulkPut(stockItems)
          return
        }
      } catch (apiErr) {
        console.warn('No se pudo obtener inventario online, cargando local:', apiErr.message)
      }
    }

    productos.value = await db.obtenerCatalogoConStock(empId)
  } catch (err) {
    console.error('Error cargando inventario:', err)
  }
}

watch(
  () => empresariaStore.empresariaActiva?.IdEmpresaria,
  (newId) => {
    if (newId) {
      cargarInventario()
    }
  },
)

const productosFiltrados = computed(() => {
  return productos.value.filter((p) => {
    const matchCat =
      categoriaSeleccionada.value === 'Todos' ||
      p.Categoria?.toLowerCase() === categoriaSeleccionada.value.toLowerCase()
    if (!matchCat) return false

    if (!filtroBusqueda.value) return true
    const q = filtroBusqueda.value.toLowerCase()
    return (
      p.Nombre?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      p.CodigoQr?.toLowerCase().includes(q)
    )
  })
})

// Paginación para vista cuadrícula
const paginaActualGrid = ref(1)
const porPaginaGrid = ref(12)

const maxPaginasGrid = computed(() => {
  return Math.ceil(productosFiltrados.value.length / porPaginaGrid.value) || 1
})

const productosPaginadosGrid = computed(() => {
  const start = (paginaActualGrid.value - 1) * porPaginaGrid.value
  return productosFiltrados.value.slice(start, start + porPaginaGrid.value)
})

const inicioRegistroGrid = computed(() => {
  if (productosFiltrados.value.length === 0) return 0
  return (paginaActualGrid.value - 1) * porPaginaGrid.value + 1
})

const finRegistroGrid = computed(() => {
  return Math.min(
    paginaActualGrid.value * porPaginaGrid.value,
    productosFiltrados.value.length,
  )
})

// Al cambiar filtros o selector de elementos por página, volver a la página 1
watch([filtroBusqueda, categoriaSeleccionada, porPaginaGrid], () => {
  paginaActualGrid.value = 1
})

// Si la cantidad de páginas disminuye por debajo de la actual, ajustar
watch(maxPaginasGrid, (newMax) => {
  if (paginaActualGrid.value > newMax) {
    paginaActualGrid.value = newMax
  }
})

const totalPiezasStock = computed(() => {
  return productos.value.reduce((acc, p) => acc + (Number(p.Stock) || 0), 0)
})

function formatPrecio(val) {
  return Number(val || 0).toFixed(2)
}

function abrirModalEntrada() {
  entradaData.value = {
    producto: productos.value[0] || null,
    cantidad: 1,
    tipo: 'MANUAL_IN',
    notas: '',
  }
  mostrarModalEntrada.value = true
}

function abrirModalNuevoManual() {
  editandoProducto.value = false
  nuevoProducto.value = {
    id: '',
    sku: '',
    Nombre: '',
    Categoria: 'Collares',
    Catalogo: 'Coleccion',
    Precio: 0,
    StockInicial: 1,
    ImgURL: '',
  }
  mostrarModalNuevo.value = true
}

function abrirModalEditar(prod) {
  editandoProducto.value = true
  nuevoProducto.value = {
    id: String(prod.id || prod.ProductoId || '').trim(),
    sku: String(prod.sku || '').trim(),
    CodigoQr: String(prod.CodigoQr || prod.sku || '').trim(),
    Nombre: prod.Nombre || '',
    Categoria: prod.Categoria || 'Collares',
    Catalogo: prod.Catalogo || 'Coleccion',
    Precio: Number(prod.Precio || 0),
    StockInicial: Number(prod.Stock || 0),
    ImgURL: prod.ImgURL || '',
  }
  mostrarModalNuevo.value = true
}

function abrirEntradaRapida(prod) {
  entradaData.value = {
    producto: prod,
    cantidad: 1,
    tipo: 'MANUAL_IN',
    notas: 'Entrada rápida desde catálogo',
  }
  mostrarModalEntrada.value = true
}

function abrirEscanerDesdeEntrada() {
  mostrarModalEntrada.value = false
  abrirEscanerQR()
}

function abrirEscanerDesdeNuevo() {
  mostrarModalNuevo.value = false
  abrirEscanerQR()
}

/**
 * Inicia el escáner de cámara para leer códigos QR de joyas Nice.
 */
async function abrirEscanerQR() {
  mostrarScanner.value = true
  await nextTick()

  try {
    html5QrCode = new Html5Qrcode('reader-inventario')
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => {
        procesarLecturaQR(decodedText)
      },
      () => {
        // Errores menores por cuadro vacío ignorados
      },
    )
  } catch (err) {
    console.error('Error al iniciar cámara QR:', err)
    $q.notify({
      type: 'negative',
      message: 'No se pudo acceder a la cámara: ' + (err.message || err),
    })
    mostrarScanner.value = false
  }
}

/**
 * Procesa la información del QR:
 * - NO inserta ni actualiza en automático.
 * - Si la joya existe -> abre modal de Entrada de Stock con el producto seleccionado.
 * - Si es nueva -> abre modal de Nueva Joya con los campos prellenados.
 */
async function procesarLecturaQR(decodedText) {
  await cerrarEscaner()

  const texto = String(decodedText).trim()
  let parsedInfo = null
  let skuExtraido = null
  let codigoPieza = null

  // 1. Limpiar URL de protocolo (http/https), parámetros (?query) y hashtags (#)
  const urlLimpia = texto
    .replace(/^https?:\/\//i, '')
    .split('?')[0]
    .split('#')[0]
  const partes = urlLimpia.split('/').filter(Boolean)

  if (!texto.startsWith('{')) {
    // Detectar si el primer segmento es el dominio (ej: nnb.mx)
    const tieneDominio = partes.length > 0 && (partes[0].includes('.') || partes[0].includes(':'))
    const segmentos = tieneDominio ? partes.slice(1) : partes

    if (segmentos.length >= 2) {
      // Caso: nnb.mx/19046882/925222 -> SKU: 19046882 | Pieza: 925222
      skuExtraido = segmentos[0]
      codigoPieza = segmentos[1]
    } else if (segmentos.length === 1) {
      // Caso: nnb.mx/19046882 -> SKU: 19046882 | Pieza: null
      skuExtraido = segmentos[0]
    }
  } else {
    // Intentar parsear como JSON si viene un payload estructurado
    try {
      parsedInfo = JSON.parse(texto)
    } catch {
      parsedInfo = null
    }
  }

  // Definir SKU y Código de Pieza finales
  const skuBuscado =
    skuExtraido || (parsedInfo && (parsedInfo.sku || parsedInfo.id || parsedInfo.CodigoQr)) || texto
  const piezaDetectada =
    codigoPieza || parsedInfo?.codigoPieza || parsedInfo?.codigo_pieza || parsedInfo?.CodigoQr || ''

  // 2. Buscar si ya existe en el catálogo local
  const encontrado = productos.value.find(
    (p) =>
      p.sku?.toLowerCase() === skuBuscado.toLowerCase() ||
      p.CodigoQr?.toLowerCase() === skuBuscado.toLowerCase() ||
      p.id?.toLowerCase() === skuBuscado.toLowerCase(),
  )

  if (encontrado) {
    // CASO A: Joya existente -> Preparar formulario de Entrada de Stock
    entradaData.value = {
      producto: encontrado,
      cantidad: 1,
      tipo: 'IN_QR',
      codigoPieza: piezaDetectada,
      codigo_pieza: piezaDetectada,
      CodigoQr: piezaDetectada,
      notas: `Entrada escaneada por QR (SKU: ${skuBuscado}${piezaDetectada ? `, Pieza: ${piezaDetectada}` : ''})`,
    }

    $q.notify({
      type: 'positive',
      icon: 'qr_code_2',
      message: `Joya identificada: "${encontrado.Nombre}"${piezaDetectada ? ` [Pieza: ${piezaDetectada}]` : ''}`,
      position: 'top',
      timeout: 3000,
    })

    mostrarModalEntrada.value = true
  } else {
    // CASO B: Joya Nueva -> Preparar formulario para agregar nueva pieza
    nuevoProducto.value = {
      id: piezaDetectada,
      sku: parsedInfo?.sku || skuBuscado,
      codigoPieza: piezaDetectada,
      codigo_pieza: piezaDetectada,
      CodigoQr: piezaDetectada,
      Nombre: parsedInfo?.Nombre || parsedInfo?.nombre || '',
      Categoria: parsedInfo?.Categoria || parsedInfo?.categoria || 'Collares',
      Catalogo: parsedInfo?.Catalogo || parsedInfo?.catalogo || 'Coleccion',
      Precio: Number(parsedInfo?.Precio || parsedInfo?.precio || 0),
      StockInicial: Number(parsedInfo?.StockInicial || parsedInfo?.cantidad || 1),
      ImgURL: parsedInfo?.ImgURL || parsedInfo?.imgUrl || '',
    }

    $q.notify({
      type: 'info',
      icon: 'auto_awesome',
      message: `Código detectado: SKU ${skuBuscado}${piezaDetectada ? ` | Pieza ${piezaDetectada}` : ''}. Formulario listo.`,
      position: 'top',
      timeout: 3500,
    })

    editandoProducto.value = false
    mostrarModalNuevo.value = true
  }
}

async function cerrarEscaner() {
  if (html5QrCode) {
    try {
      if (html5QrCode.isScanning) {
        await html5QrCode.stop()
      }
      await html5QrCode.clear()
    } catch (e) {
      console.warn('Deteniendo scanner:', e)
    }
    html5QrCode = null
  }
  mostrarScanner.value = false
}

async function guardarEntradaStock() {
  try {
    const { producto, cantidad, tipo, notas } = entradaData.value
    if (!producto || !producto.id) {
      $q.notify({ type: 'warning', message: 'Selecciona una joya válida' })
      return
    }

    const empId = Number(
      empresariaStore.empresariaActiva?.IdEmpresaria || authStore.usuario?.IdEmpresaria || 2,
    )
    const cantNum = Number(cantidad || 1)

    // 1. Actualizar en Dexie
    const stockRecord = await db.stock_empresarias.get([empId, producto.id])
    const stockActual = stockRecord ? Number(stockRecord.Stock || 0) : 0
    const nuevoStock = stockActual + cantNum

    await db.stock_empresarias.put({
      EmpresariaId: empId,
      ProductoId: producto.id,
      Stock: nuevoStock,
      updated_at: new Date().toISOString(),
    })

    await db.inventory_movements.add({
      ProductoId: producto.id,
      EmpresariaId: empId,
      tipo: tipo || 'IN_QR',
      Quantity: cantNum,
      Notas: notas || 'Entrada registrada en tablet',
      created_at: new Date().toISOString(),
    })

    // 2. Si hay conexión, enviar al backend y esperar a que MySQL confirme
    if (networkStore.isOnline) {
      try {
        await api.post('/inventario/movimiento', {
          ProductoId: producto.id,
          EmpresariaId: empId,
          tipo: tipo || 'IN_QR',
          Quantity: cantNum,
          Notas: notas,
        })
      } catch (apiErr) {
        console.warn('[Inventario] Error sincronizando movimiento con backend:', apiErr.message)
      }
    }

    $q.notify({
      type: 'positive',
      icon: 'done_all',
      message: `+${cantNum} piezas agregadas a ${producto.Nombre}`,
      position: 'top',
    })

    mostrarModalEntrada.value = false
    await cargarInventario()
  } catch (err) {
    console.error('Error al registrar entrada:', err)
    $q.notify({
      type: 'negative',
      message: 'Error al registrar entrada: ' + (err.response?.data?.message || err.message),
    })
  }
}

/**
 * Redimensiona y comprime una imagen seleccionada antes de convertirla a Base64.
 * @param {File} file - Archivo de imagen del input.
 * @param {number} maxWidth - Ancho máximo deseado (ej. 800px).
 * @param {number} quality - Calidad JPEG de 0.1 a 1.0.
 */
function comprimirImagen(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Escalar manteniendo la relación de aspecto
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Exportar como JPEG comprimido
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

// Referencias para los inputs de archivo


/**
 * Abre el modal e inicia la transmisión de la cámara (trasera si está en móvil)
 */
async function abrirCamaraProducto() {
  mostrarModalCamara.value = true
  await nextTick()

  try {
    // Intenta usar la cámara trasera ('environment') en móviles
    streamCamara = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    })

    if (videoFotoRef.value) {
      videoFotoRef.value.srcObject = streamCamara
    }
  } catch (err) {
    console.error('Error al acceder a la cámara:', err)
    $q.notify({
      type: 'negative',
      message: 'No se pudo acceder a la cámara: ' + (err.message || 'Permiso denegado')
    })
    mostrarModalCamara.value = false
  }
}

/**
 * Toma un cuadro (frame) del video en vivo, lo comprime y lo sube al backend
 */
async function capturarFotoDesdeCamara() {
  const video = videoFotoRef.value
  const canvas = canvasFotoRef.value

  if (!video || !canvas) return

  const maxWidth = 800
  let width = video.videoWidth || 800
  let height = video.videoHeight || 600

  // Escalar manteniendo la relación de aspecto
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, width, height)

  const base64Data = canvas.toDataURL('image/jpeg', 0.8)
  detenerCamaraFoto()
  mostrarModalCamara.value = false

  // Si hay conexión, subir de inmediato a /uploads en el backend
  if (networkStore.isOnline) {
    $q.loading.show({ message: 'Subiendo foto al servidor...' })
    try {
      const resp = await api.post('/upload/base64', {
        image: base64Data,
        filename: `joya_${nuevoProducto.value.id || nuevoProducto.value.sku || Date.now()}`
      })
      if (resp.data && resp.data.success && resp.data.data?.url) {
        nuevoProducto.value.ImgURL = resp.data.data.url
        $q.notify({
          type: 'positive',
          icon: 'cloud_done',
          message: 'Foto guardada en el servidor exitosamente'
        })
        return
      }
    } catch (err) {
      console.warn('Error subiendo foto online, usando local temporal:', err.message)
      nuevoProducto.value.ImgURL = base64Data
    } finally {
      $q.loading.hide()
    }
  } else {
    nuevoProducto.value.ImgURL = base64Data
    $q.notify({
      type: 'info',
      icon: 'photo_camera',
      message: 'Foto capturada en modo offline'
    })
  }
}

/**
 * Detiene los tracks del stream para liberar la cámara del dispositivo
 */
function detenerCamaraFoto() {
  if (streamCamara) {
    streamCamara.getTracks().forEach((track) => track.stop())
    streamCamara = null
  }
}

function abrirGaleriaProducto() {
  if (inputGaleriaRef.value) inputGaleriaRef.value.click()
}

async function alSeleccionarFotoProducto(event) {
  const file = event.target.files?.[0]
  if (!file) return

  $q.loading.show({ message: 'Procesando y subiendo imagen...' })

  try {
    if (networkStore.isOnline) {
      const formData = new FormData()
      formData.append('image', file)

      const resp = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (resp.data && resp.data.success && resp.data.data?.url) {
        nuevoProducto.value.ImgURL = resp.data.data.url
        $q.notify({
          type: 'positive',
          icon: 'cloud_done',
          message: 'Imagen subida al servidor exitosamente'
        })
      } else {
        throw new Error(resp.data?.message || 'Error al subir imagen')
      }
    } else {
      const base64Data = await comprimirImagen(file, 800, 0.8)
      nuevoProducto.value.ImgURL = base64Data
      $q.notify({
        type: 'info',
        icon: 'photo',
        message: 'Imagen guardada localmente (Modo Offline)'
      })
    }
  } catch (err) {
    console.error('Error procesando imagen:', err)
    $q.notify({
      type: 'negative',
      message: 'Error al subir imagen: ' + (err.response?.data?.message || err.message)
    })
  } finally {
    $q.loading.hide()
    event.target.value = ''
  }
}

/**
 * Helper para asegurar que la URL enviada a MySQL sea una ruta corta (/uploads/...) y no un Base64 gigante
 */
async function asegurarUrlImagenParaBackend(imgUrl, id) {
  if (!imgUrl || typeof imgUrl !== 'string') return null
  const trimmed = imgUrl.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('data:image/') && networkStore.isOnline) {
    try {
      const resp = await api.post('/upload/base64', {
        image: trimmed,
        filename: `joya_${id || Date.now()}`
      })
      if (resp.data && resp.data.success && resp.data.data?.url) {
        return resp.data.data.url
      }
    } catch (e) {
      console.warn('No se pudo convertir Base64 a archivo en servidor:', e.message)
    }
  }

  // Si sigue siendo Base64 por estar offline, en Dexie se guarda el base64 pero para MySQL evitamos romper varchar(255)
  if (trimmed.startsWith('data:image/')) {
    return null
  }

  return trimmed
}

async function guardarProducto() {
  if (editandoProducto.value) {
    await guardarEdicionProducto()
  } else {
    await guardarNuevoProducto()
  }
}

async function guardarEdicionProducto() {
  try {
    const p = nuevoProducto.value
    if (!p.id || !p.sku || !p.Nombre || p.Precio === undefined || p.Precio === '') {
      $q.notify({ type: 'warning', message: 'Completa los campos obligatorios (*)' })
      return
    }

    const precioNum = Number(p.Precio || 0)
    const descuento = Number(empresariaStore.descuentoActivo || 25)
    const precioCosto = precioNum * (1 - descuento / 100)

    // Asegurar que si la imagen es base64 se suba a /uploads
    const imgUrlFinal = await asegurarUrlImagenParaBackend(p.ImgURL, p.id)

    const datosActualizar = {
      sku: String(p.sku).trim(),
      CodigoQr: String(p.CodigoQr || p.sku).trim(),
      Nombre: p.Nombre.trim(),
      Categoria: p.Categoria || 'Collares',
      Catalogo: p.Catalogo || 'Coleccion 126',
      Precio: precioNum,
      PrecioCosto: precioCosto,
      ImgURL: imgUrlFinal || p.ImgURL || null,
    }

    // 1. Actualizar en Dexie
    await db.productos.update(p.id, {
      ...datosActualizar,
      ImgURL: p.ImgURL || imgUrlFinal || null
    })

    // 2. Si hay conexión a internet, enviar actualización a MySQL
    if (networkStore.isOnline) {
      try {
        await api.put(`/productos/${p.id}`, datosActualizar)
      } catch (apiErr) {
        console.warn('Sync actualización producto falló:', apiErr.message)
      }
    }

    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `Joya "${datosActualizar.Nombre}" actualizada exitosamente`,
    })

    mostrarModalNuevo.value = false
    editandoProducto.value = false
    await cargarInventario()
  } catch (err) {
    console.error('Error al editar producto:', err)
    $q.notify({
      type: 'negative',
      message: 'Error al editar producto: ' + (err.response?.data?.message || err.message),
    })
  }
}

async function guardarNuevoProducto() {
  try {
    const p = nuevoProducto.value
    if (!p.id || !p.sku || !p.Nombre || p.Precio === undefined || p.Precio === '') {
      $q.notify({ type: 'warning', message: 'Completa los campos obligatorios (*)' })
      return
    }

    const empId = Number(
      empresariaStore.empresariaActiva?.IdEmpresaria || authStore.usuario?.IdEmpresaria || 2,
    )
    const stockInicialNum = Number(p.StockInicial || 0)
    const precioNum = Number(p.Precio || 0)
    const descuento = Number(empresariaStore.descuentoActivo || 25)

    // Asegurar que si la imagen es base64 se suba a /uploads
    const imgUrlFinal = await asegurarUrlImagenParaBackend(p.ImgURL, p.id)

    const prodObj = {
      id: String(p.id).trim(),
      sku: String(p.sku).trim(),
      CodigoQr: String(p.CodigoQr || p.codigoPieza || p.sku).trim(),
      Nombre: p.Nombre.trim(),
      Categoria: p.Categoria || 'Collares',
      Catalogo: p.Catalogo || 'Coleccion 126',
      Precio: precioNum,
      PrecioCosto: precioNum * (1 - descuento / 100),
      ImgURL: imgUrlFinal || p.ImgURL || null,
      StockInicial: stockInicialNum,
      EmpresariaId: empId,
    }

    // 1. Guardar producto en Dexie
    await db.productos.put({
      id: prodObj.id,
      sku: prodObj.sku,
      CodigoQr: prodObj.CodigoQr,
      Nombre: prodObj.Nombre,
      Categoria: prodObj.Categoria,
      Catalogo: prodObj.Catalogo,
      Precio: prodObj.Precio,
      PrecioCosto: prodObj.PrecioCosto,
      ImgURL: p.ImgURL || imgUrlFinal || null,
      Stock: stockInicialNum,
    })

    // 2. Si se asignó stock inicial, guardarlo en Dexie
    if (stockInicialNum > 0) {
      await db.stock_empresarias.put({
        EmpresariaId: empId,
        ProductoId: prodObj.id,
        Stock: stockInicialNum,
        updated_at: new Date().toISOString(),
      })

      await db.inventory_movements.add({
        ProductoId: prodObj.id,
        EmpresariaId: empId,
        tipo: 'IN_QR',
        Quantity: stockInicialNum,
        Notas: 'Inventario inicial al registrar joya',
        created_at: new Date().toISOString(),
      })
    }

    // 3. Si hay red, enviar al backend y esperar confirmación en MySQL
    if (networkStore.isOnline) {
      try {
        await api.post('/productos', prodObj)
      } catch (apiErr) {
        console.warn('Sync producto nuevo falló:', apiErr.message)
      }
    }

    $q.notify({ type: 'positive', icon: 'diamond', message: 'Joya registrada exitosamente' })
    mostrarModalNuevo.value = false
    editandoProducto.value = false
    nuevoProducto.value = {
      id: '',
      sku: '',
      Nombre: '',
      Categoria: 'Collares',
      Catalogo: 'Nice 2026',
      Precio: 0,
      StockInicial: 1,
      ImgURL: '',
    }
    await cargarInventario()
  } catch (err) {
    console.error('Error al guardar producto:', err)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar producto: ' + (err.response?.data?.message || err.message),
    })
  }
}

onMounted(() => {
  cargarInventario()
})

onBeforeUnmount(() => {
  cerrarEscaner()
  detenerCamaraFoto()
})
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
