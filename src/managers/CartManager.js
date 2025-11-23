import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export default class CartManager {
  async getAll() {
    try {
      const carts = await Cart.find({}).populate("products.productId");
      return carts;
    } catch (error) {
      throw new Error(`Error al obtener carritos: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const cart = await Cart.findById(id).populate("products.productId");
      return cart;
    } catch (error) {
      throw new Error(`Error al obtener carrito: ${error.message}`);
    }
  }

  async create() {
    try {
      const cart = new Cart({ products: [] });
      await cart.save();
      return cart;
    } catch (error) {
      throw new Error(`Error al crear carrito: ${error.message}`);
    }
  }

  async addProduct(cartId, productId, quantity = 1) {
    // quantity = 1 Suma 1 por defecto si no le declaramos quantity en el body.
    try {
      // Verificar que el producto existe
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Producto no encontrado");
      }

      const cart = await Cart.findById(cartId);
      if (!cart) {
        throw new Error("Carrito no encontrado");
      }

      // Buscar si el producto ya está en el carrito
      const existingProductIndex = cart.products.findIndex(
        p => p.productId.toString() === productId.toString()
      );

      if (existingProductIndex !== -1) {
        // Si existe, actualizar la cantidad
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        // Si no existe, agregarlo
        cart.products.push({ productId, quantity });
      }

      await cart.save();
      return await Cart.findById(cartId).populate("products.productId");
    } catch (error) {
      throw new Error(`Error al agregar producto al carrito: ${error.message}`);
    }
  }

  async removeProduct(cartId, productId) {
    try {
      const cart = await Cart.findById(cartId);
      if (!cart) {
        throw new Error("Carrito no encontrado");
      }

      cart.products = cart.products.filter(
        p => p.productId.toString() !== productId.toString()
      );

      await cart.save();
      return await Cart.findById(cartId).populate("products.productId");
    } catch (error) {
      throw new Error(`Error al eliminar producto del carrito: ${error.message}`);
    }
  }

  async clearCart(cartId) {
    try {
      const cart = await Cart.findById(cartId);
      if (!cart) {
        throw new Error("Carrito no encontrado");
      }

      cart.products = [];
      await cart.save();
      return await Cart.findById(cartId).populate("products.productId");
    } catch (error) {
      throw new Error(`Error al vaciar carrito: ${error.message}`);
    }
  }

  async updateProductQuantity(cartId, productId, quantity) {
    try {
      const cart = await Cart.findById(cartId);
      if (!cart) {
        throw new Error("Carrito no encontrado");
      }

      // Verificar que el producto existe
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Producto no encontrado");
      }

      // Buscar el producto en el carrito
      const productIndex = cart.products.findIndex(
        p => p.productId.toString() === productId.toString()
      );

      if (productIndex === -1) {
        throw new Error("Producto no encontrado en el carrito");
      }

      // Validar que la cantidad sea válida
      if (quantity < 1) {
        throw new Error("La cantidad debe ser mayor a 0");
      }

      // Actualizar solo la cantidad
      cart.products[productIndex].quantity = quantity;

      await cart.save();
      return await Cart.findById(cartId).populate("products.productId");
    } catch (error) {
      throw new Error(`Error al actualizar cantidad del producto: ${error.message}`);
    }
  }
}


