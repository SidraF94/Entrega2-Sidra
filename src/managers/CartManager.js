import { promises as fs } from "fs";
import crypto from "crypto";
 
export default class CartManager {
  async getAll() {
    const raw = await fs.readFile("src/data/carts.json", "utf-8");
    return JSON.parse(raw);
  }

  async getById(id) {
    const raw = await fs.readFile("src/data/carts.json", "utf-8");
    const carts = JSON.parse(raw);
    return carts.find(c => String(c.id) === String(id));
  }

  async create() {
    const raw = await fs.readFile("src/data/carts.json", "utf-8");
    const carts = JSON.parse(raw);
    const cart = { id: crypto.randomUUID(), products: [] };
    carts.push(cart);
    //"2" para que se vea bien el json
    await fs.writeFile("src/data/carts.json", JSON.stringify(carts, null, 2), "utf-8");
    return cart;
  }

  async addProduct(cartId, productId, quantity = 1) {
    // quantity = 1 Suma 1 por defecto si no le declaramos quantity en el body.
    const raw = await fs.readFile("src/data/carts.json", "utf-8");
    const carts = JSON.parse(raw);
    const index = carts.findIndex(c => String(c.id) === String(cartId));
    if (index === -1) return null;
    const cart = carts[index];
    const existingProduct = cart.products.find(p => String(p.productId) === String(productId));
    if (existingProduct) {
      existingProduct.quantity += quantity;
    } else {
      cart.products.push({ productId, quantity });
    }
    carts[index] = cart;
    await fs.writeFile("src/data/carts.json", JSON.stringify(carts, null, 2), "utf-8");
    return cart;
  }

  async removeProduct(cartId, productId) {
    const raw = await fs.readFile("src/data/carts.json", "utf-8");
    const carts = JSON.parse(raw);
    const index = carts.findIndex(c => String(c.id) === String(cartId));
    if (index === -1) return null;
    const cart = carts[index];
    cart.products = cart.products.filter(p => String(p.productId) !== String(productId));
    carts[index] = cart;
    await fs.writeFile("src/data/carts.json", JSON.stringify(carts, null, 2), "utf-8");
    return cart;
  }
}


