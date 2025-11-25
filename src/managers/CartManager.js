import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// FUNCIONES HELPER PARA NORMALIZAR LOS DATOS DE CART MANAGER ----------------------------------------------------------------------------

// Mongoose ObjectIds no son JSON, así que los convertimos a string
const stringifyId = value =>
  value && typeof value.toString === "function" ? value.toString() : value;

// Normaliza un documento de producto venido por populate para que
// su _id ya esté stringified y listo para ser enviado al cliente o renderizado
const normalizarProductRef = product => {
  if (!product) return product;
  return {
    ...product,
    _id: stringifyId(product._id)
  };
};

// Unifico la forma en que devolvemos carritos:
// Convierte el _id del carrito y de cada producto a string
// Calcula itemTotal para evitar hacerlo repetidamente en cada vista
const normalizarCart = cart => {
  if (!cart) return cart;
  const rawCart = typeof cart.toObject === "function" ? cart.toObject() : cart;

  const products = (rawCart.products || []).map(item => {
    const normalizedProduct = normalizarProductRef(item.productId);

    // Calculamos el total del ítem aca para no repetirlo en cada ruta
    const itemTotal =
      normalizedProduct && normalizedProduct.price
        ? normalizedProduct.price * item.quantity
        : 0;

    return {
      ...item,
      productId: normalizedProduct,
      itemTotal
    };
  });

  return {
    ...rawCart,
    _id: stringifyId(rawCart._id), // el carrito también se entrega con _id en string
    products
  };
};

// -----------------------------------------------------------------------------------------------------------------------------------------------

export default class CartManager {
  async getAll() {
    try {
      const carts = await Cart.find({})
        .populate("products.productId")
        .lean();
      return carts.map(normalizarCart);
    } catch (error) {
      throw new Error(`Error al obtener carritos: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const cart = await Cart.findById(id)
        .populate("products.productId")
        .lean();
      return normalizarCart(cart);
    } catch (error) {
      throw new Error(`Error al obtener carrito: ${error.message}`);
    }
  }

  async create() {
    try {
      const cart = new Cart({ products: [] });
      const saved = await cart.save();
      return normalizarCart(saved);
    } catch (error) {
      throw new Error(`Error al crear carrito: ${error.message}`);
    }
  }

  async addProduct(cartId, productId, quantity = 1) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Producto no encontrado");
      }

      const cart = await Cart.findById(cartId);
      if (!cart) {
        throw new Error("Carrito no encontrado");
      }

      const existingProductIndex = cart.products.findIndex(
        p => p.productId.toString() === productId.toString()
      );

      if (existingProductIndex !== -1) {
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        cart.products.push({ productId, quantity });
      }

      await cart.save();
      const updatedCart = await Cart.findById(cartId)
        .populate("products.productId")
        .lean();
      return normalizarCart(updatedCart);
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
      const updatedCart = await Cart.findById(cartId)
        .populate("products.productId")
        .lean();
      return normalizarCart(updatedCart);
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
      const updatedCart = await Cart.findById(cartId)
        .populate("products.productId")
        .lean();
      return normalizarCart(updatedCart);
    } catch (error) {
      throw new Error(`Error al vaciar carrito: ${error.message}`);
    }
  }

  async delete(cartId) {
    try {
      const deleted = await Cart.findByIdAndDelete(cartId);
      return deleted !== null;
    } catch (error) {
      throw new Error(`Error al eliminar carrito: ${error.message}`);
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
      const updatedCart = await Cart.findById(cartId)
        .populate("products.productId")
        .lean();
      return normalizarCart(updatedCart);
    } catch (error) {
      throw new Error(`Error al actualizar cantidad del producto: ${error.message}`);
    }
  }
}


