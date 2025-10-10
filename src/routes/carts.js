import express from "express";
import CartManager from "../managers/CartManager.js";

const router = express.Router();
const cartManager = new CartManager();

// Rutas de carritos
router.get("/", async (req, res) => {
  try {
    const carts = await cartManager.getAll();
    res.json(carts);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const cart = await cartManager.getById(req.params.id);
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const cart = await cartManager.create();
    res.status(201).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.post("/:cid/product/:pid", async (req, res) => {
  try {
    const quantity = Number(req.body?.quantity ?? 1) || 1;
    const cart = await cartManager.addProduct(req.params.cid, req.params.pid, quantity);
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.delete("/:cid/product/:pid", async (req, res) => {
  try {
    const cart = await cartManager.removeProduct(req.params.cid, req.params.pid);
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });
    console.log("Producto eliminado del carrito correctamente");
    res.status(200).json({ message: "Producto eliminado del carrito correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

export default router;
