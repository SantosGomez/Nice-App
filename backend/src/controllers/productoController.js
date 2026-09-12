import { ProductoModel } from '../models/productoModel.js';

/**
 * Controlador de Productos.
 * Maneja la validación de peticiones y respuestas HTTP.
 */
export const ProductoController = {
  /**
   * GET /api/productos
   * Obtiene la lista de productos con soporte para filtros y stock por empresaria.
   */
  async getProductos(req, res) {
    try {
      const { empresariaId, search, categoria } = req.query;
      const productos = await ProductoModel.getAll({
        empresariaId: empresariaId ? Number(empresariaId) : null,
        search,
        categoria
      });

      return res.status(200).json({
        success: true,
        count: productos.length,
        data: productos
      });
    } catch (error) {
      console.error('Error en getProductos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener los productos',
        error: error.message
      });
    }
  },

  /**
   * GET /api/productos/:id
   * Obtiene un producto por su ID.
   */
  async getProductoById(req, res) {
    try {
      const { id } = req.params;
      const { empresariaId } = req.query;
      const producto = await ProductoModel.getById(id, empresariaId ? Number(empresariaId) : null);

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: `Producto con ID '${id}' no encontrado`
        });
      }

      return res.status(200).json({
        success: true,
        data: producto
      });
    } catch (error) {
      console.error('Error en getProductoById:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener el producto',
        error: error.message
      });
    }
  },

  /**
   * GET /api/productos/find/:code
   * Busca producto por SKU o Código QR para el lector del POS.
   */
  async findByCode(req, res) {
    try {
      const { code } = req.params;
      const { empresariaId } = req.query;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Debes proporcionar un código QR o SKU para buscar'
        });
      }

      const producto = await ProductoModel.findByCode(code, empresariaId ? Number(empresariaId) : null);

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: `No se encontró ningún producto con el código '${code}'`
        });
      }

      return res.status(200).json({
        success: true,
        data: producto
      });
    } catch (error) {
      console.error('Error en findByCode:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al buscar el producto por código',
        error: error.message
      });
    }
  },

  /**
   * POST /api/productos
   * Registra un nuevo producto.
   */
  async createProducto(req, res) {
    try {
      const { id, sku, CodigoQr, Nombre, Categoria, Catalogo, Precio, PrecioCosto, ImgURL } = req.body;

      // Validaciones básicas de campos obligatorios
      if (!id || !sku || !Nombre || Precio === undefined || !Categoria || !Catalogo) {
        return res.status(400).json({
          success: false,
          message: 'Los campos id, sku, Nombre, Categoria, Catalogo y Precio son obligatorios'
        });
      }

      // Verificar si ya existe un producto con el mismo id o sku
      const existing = await ProductoModel.getById(id);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Ya existe un producto con el ID '${id}'`
        });
      }

      const nuevoProducto = await ProductoModel.create({
        id,
        sku,
        CodigoQr,
        Nombre,
        Categoria,
        Catalogo,
        Precio: Number(Precio),
        PrecioCosto: PrecioCosto !== undefined ? Number(PrecioCosto) : 0.0,
        ImgURL
      });

      return res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: nuevoProducto
      });
    } catch (error) {
      console.error('Error en createProducto:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al registrar el producto',
        error: error.message
      });
    }
  },

  /**
   * PUT /api/productos/:id
   * Actualiza los datos de un producto.
   */
  async updateProducto(req, res) {
    try {
      const { id } = req.params;
      const updated = await ProductoModel.update(id, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: `Producto con ID '${id}' no encontrado o sin cambios para actualizar`
        });
      }

      const productoActualizado = await ProductoModel.getById(id);

      return res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: productoActualizado
      });
    } catch (error) {
      console.error('Error en updateProducto:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar el producto',
        error: error.message
      });
    }
  },

  /**
   * DELETE /api/productos/:id
   * Elimina un producto.
   */
  async deleteProducto(req, res) {
    try {
      const { id } = req.params;
      const deleted = await ProductoModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `Producto con ID '${id}' no encontrado`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error en deleteProducto:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar el producto',
        error: error.message
      });
    }
  }
};
