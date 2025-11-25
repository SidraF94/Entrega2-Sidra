import express from "express";
import mongoose from "mongoose";
import CartManager from "../managers/CartManager.js";

const router = express.Router();
const cartManager = new CartManager();

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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "ID de carrito inválido" });
    }

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
    if (!mongoose.Types.ObjectId.isValid(req.params.cid)) {
      return res.status(400).json({ error: "ID de carrito inválido" });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.pid)) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    const quantity = Number(req.body?.quantity ?? 1) || 1;
    if (quantity < 1) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
    }

    const cart = await cartManager.addProduct(req.params.cid, req.params.pid, quantity);
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });

    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.delete("/:cid/products/:pid", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.cid)) {
      return res.status(400).json({ error: "ID de carrito inválido" });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.pid)) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    const cart = await cartManager.removeProduct(req.params.cid, req.params.pid);
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });
    res.status(200).json({ message: "Producto eliminado del carrito correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.put("/:cid/products/:pid", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.cid)) {
      return res.status(400).json({ error: "ID de carrito inválido" });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.pid)) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    if (!req.body.quantity) {
      return res.status(400).json({ error: "La cantidad es requerida" });
    }

    const quantity = Number(req.body.quantity);
    
    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ error: "La cantidad debe ser un número mayor a 0" });
    }

    const cart = await cartManager.updateProductQuantity(req.params.cid, req.params.pid, quantity);
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });

    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

// Ruta para eliminar el carrito completamente
router.delete("/:cid/hard", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.cid)) {
      return res.status(400).json({ error: "ID de carrito inválido" });
    }

    const deleted = await cartManager.delete(req.params.cid);
    if (!deleted) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    res.status(200).json({ message: "Carrito eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.delete("/:cid", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.cid)) {
      return res.status(400).json({ error: "ID de carrito inválido" });
    }

    const cart = await cartManager.clearCart(req.params.cid);
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });
    res.status(200).json({ message: "Todos los productos eliminados del carrito correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

export default router;
