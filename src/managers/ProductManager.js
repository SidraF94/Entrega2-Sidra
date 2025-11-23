import Product from "../models/Product.js";

export default class ProductManager {
  async getAll() {
    try {
      const products = await Product.find({});
      return products;
    } catch (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  async getPaginated({ limit = 10, page = 1, sort, query }) {
    try {
      // Construir filtro basado en query
      let filter = {};
      
      if (query) {
        // Si query es "available" o "disponible", filtrar por status
        if (query.toLowerCase() === 'available' || query.toLowerCase() === 'disponible') {
          filter.status = true;
        } else {
          // Si no, buscar por categoría
          filter.category = { $regex: query, $options: 'i' };
        }
      }

      // Construir ordenamiento
      let sortOption = {};
      if (sort === 'asc') {
        sortOption.price = 1;
      } else if (sort === 'desc') {
        sortOption.price = -1;
      }

      // Calcular skip
      const skip = (page - 1) * limit;

      // Obtener productos con filtros, ordenamiento y paginación
      const products = await Product.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit);

      // Contar total de documentos que coinciden con el filtro
      const totalDocs = await Product.countDocuments(filter);
      const totalPages = Math.ceil(totalDocs / limit);

      // Calcular páginas anterior y siguiente
      const hasPrevPage = page > 1;
      const hasNextPage = page < totalPages;
      const prevPage = hasPrevPage ? page - 1 : null;
      const nextPage = hasNextPage ? page + 1 : null;

      return {
        products,
        totalDocs,
        limit,
        page,
        totalPages,
        hasPrevPage,
        hasNextPage,
        prevPage,
        nextPage
      };
    } catch (error) {
      throw new Error(`Error al obtener productos paginados: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const product = await Product.findById(id);
      return product;
    } catch (error) {
      throw new Error(`Error al obtener producto: ${error.message}`);
    }
  }

  async add(productInput) {
    try {
      const product = new Product(productInput);
      await product.save();
      return product;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error(`El código ${productInput.code} ya existe`);
      }
      throw new Error(`Error al agregar producto: ${error.message}`);
    }
  }

  async update(id, updates) {
    try {
      const product = await Product.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );
      return product;
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const result = await Product.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }
}


