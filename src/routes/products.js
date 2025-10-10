import express from "express";
import ProductManager from "../managers/ProductManager.js";

const router = express.Router();
const productManager = new ProductManager();

// Rutas de productos
router.get("/", async (req, res) => {
  try {
    const products = await productManager.getAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await productManager.getById(req.params.id);
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const product = await productManager.add(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await productManager.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Producto no encontrado" });
    console.log("Producto modificado exitosamente.");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const ok = await productManager.delete(req.params.id);
    if (!ok) return res.status(404).json({ error: "Producto no encontrado" });
    console.log("Producto eliminado correctamente");
    res.status(200).json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

export default router;
