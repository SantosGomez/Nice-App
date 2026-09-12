import { defineStore } from 'pinia';
import db from '../db/index.js';
import SyncService from '../services/syncService.js';
import { useEmpresariaStore } from './empresariaStore.js';
import { useNetworkStore } from './networkStore.js';

export const usePosStore = defineStore('pos', {
  state: () => ({
    // Artículos en el carrito actual
    carrito: [],

    // Cliente seleccionado para la venta (opcional en venta directa)
    clienteSeleccionado: null,

    // Configuración de venta
    tipoVenta: 'DIRECTA', // 'DIRECTA' | 'APARTADO'
    metodoPago: 'Efectivo', // 'Efectivo' | 'Tarjeta' | 'Transferencia'
    montoRecibido: 0,
    montoAbonoApartado: 0 // Si es apartado, importe del enganche o abono inicial
  }),

  getters: {
    // Total de piezas en el carrito
    totalArticulos: (state) =>
      state.carrito.reduce((acc, item) => acc + item.cantidad, 0),

    // Total a precio catálogo Nice
    totalCatalogo: (state) =>
      state.carrito.reduce((acc, item) => acc + item.Precio * item.cantidad, 0),

    // Costo total de adquisición según el descuento de la empresaria
    costoEmpresaria: (state) => {
      const empresariaStore = useEmpresariaStore();
      const descuento = empresariaStore.descuentoActivo / 100;
      return state.carrito.reduce(
        (acc, item) => acc + (item.Precio * (1 - descuento)) * item.cantidad,
        0
      );
    },

    // Ganancia estimada para la empresaria
    gananciaEstimada: (state) => {
      const empresariaStore = useEmpresariaStore();
      const descuento = empresariaStore.descuentoActivo / 100;
      return state.carrito.reduce(
        (acc, item) => acc + (item.Precio * descuento) * item.cantidad,
        0
      );
    },

    // Total final a cobrar al cliente final
    totalCobro() {
      return this.totalCatalogo;
    },

    // Cálculo de cambio en efectivo
    cambioCalculado(state) {
      const aCobrar =
        state.tipoVenta === 'APARTADO'
          ? Number(state.montoAbonoApartado || 0)
          : this.totalCobro;
      const recibido = Number(state.montoRecibido || 0);
      return Math.max(0, recibido - aCobrar);
    }
  },

  actions: {
    /**
     * Agrega un producto al carrito de venta.
     */
    agregarProducto(producto, cantidad = 1) {
      const index = this.carrito.findIndex((item) => item.id === producto.id);
      if (index !== -1) {
        this.carrito[index].cantidad += cantidad;
      } else {
        this.carrito.push({
          id: producto.id,
          sku: producto.sku,
          CodigoQr: producto.CodigoQr,
          Nombre: producto.Nombre,
          Categoria: producto.Categoria,
          Catalogo: producto.Catalogo,
          Precio: Number(producto.Precio),
          PrecioCosto: Number(producto.PrecioCosto || 0),
          ImgURL: producto.ImgURL || null,
          cantidad: cantidad
        });
      }
    },

    /**
     * Modifica la cantidad de una partida del carrito.
     */
    modificarCantidad(productoId, delta) {
      const item = this.carrito.find((i) => i.id === productoId);
      if (item) {
        item.cantidad += delta;
        if (item.cantidad <= 0) {
          this.removerProducto(productoId);
        }
      }
    },

    /**
     * Elimina una partida del carrito.
     */
    removerProducto(productoId) {
      this.carrito = this.carrito.filter((i) => i.id !== productoId);
    },

    /**
     * Vacía completamente el carrito.
     */
    limpiarCarrito() {
      this.carrito = [];
      this.clienteSeleccionado = null;
      this.montoRecibido = 0;
      this.montoAbonoApartado = 0;
    },

    /**
     * Registra y cobra la venta.
     * Guarda en Dexie (IndexedDB) de inmediato y si hay red, sincroniza con el servidor.
     */
    async procesarVenta() {
      if (this.carrito.length === 0) {
        throw new Error('El carrito está vacío');
      }

      const empresariaStore = useEmpresariaStore();
      const networkStore = useNetworkStore();

      // Generar UUID estándar para la venta offline
      const IdVenta =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'pos-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

      const itemsVenta = this.carrito.map((item) => ({
        ProductoId: item.id,
        Precio_unit: item.Precio,
        Costo_unit: item.Precio * (1 - (empresariaStore.descuentoActivo / 100)),
        Cantidad: item.cantidad
      }));

      // Determinar pagos
      let pagosVenta = [];
      let estadoVenta = 'COMPLETADA';

      if (this.tipoVenta === 'DIRECTA') {
        pagosVenta = [
          {
            Cantidad: this.totalCobro,
            Metodo_Pago: this.metodoPago
          }
        ];
      } else {
        // En sistema de apartado, puede haber abono inicial o cero
        const enganche = Number(this.montoAbonoApartado || 0);
        estadoVenta = enganche >= this.totalCobro ? 'COMPLETADA' : 'PENDIENTE';
        if (enganche > 0) {
          pagosVenta = [
            {
              Cantidad: enganche,
              Metodo_Pago: this.metodoPago
            }
          ];
        }
      }

      // 1. Guardar de forma atómica en Dexie (IndexedDB)
      const resLocal = await db.guardarVentaOffline({
        IdVenta,
        Cliente_Id: this.clienteSeleccionado ? this.clienteSeleccionado.IdCliente : null,
        EmpresariaId: empresariaStore.empresariaActiva?.IdEmpresaria || 1,
        TipoVenta: this.tipoVenta,
        Estado: estadoVenta,
        total: this.totalCobro,
        TotalCosto: this.costoEmpresaria,
        items: itemsVenta,
        pagos: pagosVenta
      });

      // 2. Actualizar contador de pendientes
      await networkStore.updatePendingCount();

      // 3. Si hay conexión en este instante, empujar la venta al servidor
      if (networkStore.isOnline) {
        SyncService.pushToServer().catch((err) => {
          console.warn('[POS] Intento de Push inmediato falló, sincronizará en cola:', err.message);
        });
      }

      // 4. Limpiar estado para la siguiente venta
      this.limpiarCarrito();

      return {
        success: true,
        IdVenta,
        total: resLocal.total
      };
    }
  }
});

export default usePosStore;
