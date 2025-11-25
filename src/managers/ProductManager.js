import Product from "../models/Product.js";

const formatProduct = product => {
  if (!product) return product;
  const objectIdToString = value =>
    value && typeof value.toString === "function" ? value.toString() : value;

  return {
    ...product,
    _id: objectIdToString(product._id)
  };
};

export default class ProductManager {
  async getAll() {
    try {
      const products = await Product.find({}).lean();
      return products.map(formatProduct);
    } catch (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  async getPaginated({ limit = 10, page = 1, sort, query }) {
    try {
      let filter = {};
      
      if (query) {
        if (query.toLowerCase() === 'available' || query.toLowerCase() === 'disponible') {
          filter.status = true;
        } else {
          filter.category = { $regex: query, $options: 'i' };
        }
      }

      let sortOption = {};
      if (sort === 'asc') {
        sortOption.price = 1;
      } else if (sort === 'desc') {
        sortOption.price = -1;
      }

      const options = {
        page: page,
        limit: limit,
        sort: sortOption,
        lean: true
      };

      const result = await Product.paginate(filter, options);

      const productsReady = result.docs.map(formatProduct);

      return {
        products: productsReady,
        totalDocs: result.totalDocs,
        limit: result.limit,
        page: result.page,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage
      };
    } catch (error) {
      throw new Error(`Error al obtener productos paginados: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const product = await Product.findById(id).lean();
      return formatProduct(product);
    } catch (error) {
      throw new Error(`Error al obtener producto: ${error.message}`);
    }
  }

  async add(productInput) {
    try {
      const product = new Product(productInput);
      const savedProduct = await product.save();
      return savedProduct;
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
