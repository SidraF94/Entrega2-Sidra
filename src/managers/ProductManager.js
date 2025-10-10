import { promises as fs } from "fs";
import crypto from "crypto";
 

export default class ProductManager {
  async getAll() {
    const raw = await fs.readFile("src/data/products.json", "utf-8");
    return JSON.parse(raw);
  }

  async getById(id) {
    const raw = await fs.readFile("src/data/products.json", "utf-8");
    const products = JSON.parse(raw);
    return products.find(p => String(p.id) === String(id));
  }

  async add(productInput) {
    const raw = await fs.readFile("src/data/products.json", "utf-8");
    const products = JSON.parse(raw);
    const product = { id: crypto.randomUUID(), ...productInput };
    products.push(product);
    await fs.writeFile("src/data/products.json", JSON.stringify(products, null, 2), "utf-8");
    return product;
  }

  async update(id, updates) {
    const raw = await fs.readFile("src/data/products.json", "utf-8");
    const products = JSON.parse(raw);
    const index = products.findIndex(p => String(p.id) === String(id));
    if (index === -1) return null;
    products[index] = { ...products[index], ...updates, id: products[index].id };
    await fs.writeFile("src/data/products.json", JSON.stringify(products, null, 2), "utf-8");
    return products[index];
  }

  async delete(id) {
    const raw = await fs.readFile("src/data/products.json", "utf-8");
    const products = JSON.parse(raw);
    const index = products.findIndex(p => String(p.id) === String(id));
    if (index === -1) return false;
    products.splice(index, 1);
    await fs.writeFile("src/data/products.json", JSON.stringify(products, null, 2), "utf-8");
    return true;
  }
}


