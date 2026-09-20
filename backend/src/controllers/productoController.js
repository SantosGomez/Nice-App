import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProductoModel } from '../models/productoModel.js';

// Recrear __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convierte una cadena Base64 en archivo físico y devuelve la ruta relativa.
 */
function guardarFotoEnCarpeta(base64String) {
  if (!base64String || !base64String.startsWith('data:image')) {
    return base64String;
  }

  // Guardar en la carpeta public/images a nivel del backend
  const carpetaDestino = path.join(__dirname, '../public/images');

  if (!fs.existsSync(carpetaDestino)) {
    fs.mkdirSync(carpetaDestino, { recursive: true });
  }

  const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches) return base64String;

  const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const bufferImagen = Buffer.from(matches[2], 'base64');

  const nombreArchivo = `joya_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
  const rutaCompletaArchivo = path.join(carpetaDestino, nombreArchivo);

  fs.writeFileSync(rutaCompletaArchivo, bufferImagen);

  return `/images/${nombreArchivo}`;
}

export const ProductoController = {
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

  async createProducto(req, res) {
    try {
      let { id, sku, CodigoQr, Nombre, Categoria, Catalogo, Precio, PrecioCosto, ImgURL, StockInicial, EmpresariaId } = req.body;

      if (!id || !sku || !Nombre || Precio === undefined || !Categoria || !Catalogo) {
        return res.status(400).json({
          success: false,
          message: 'Los campos id, sku, Nombre, Categoria, Catalogo y Precio son obligatorios'
        });
      }

      const existing = await ProductoModel.getById(id);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Ya existe un producto con el ID '${id}'`
        });
      }

      // Procesar la imagen si viene en Base64
      const rutaGuardadaImg = guardarFotoEnCarpeta(ImgURL);

      const nuevoProducto = await ProductoModel.create({
        id,
        sku,
        CodigoQr,
        Nombre,
        Categoria,
        Catalogo,
        Precio: Number(Precio),
        PrecioCosto: PrecioCosto !== undefined ? Number(PrecioCosto) : 0.0,
        ImgURL: rutaGuardadaImg,
        StockInicial: StockInicial !== undefined ? Number(StockInicial) : 0,
        EmpresariaId: EmpresariaId ? Number(EmpresariaId) : null
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

  async updateProducto(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Si se envía una nueva imagen en Base64, procesarla
      if (updateData.ImgURL) {
        updateData.ImgURL = guardarFotoEnCarpeta(updateData.ImgURL);
      }

      const updated = await ProductoModel.update(id, updateData);

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