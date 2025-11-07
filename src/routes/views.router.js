import express from "express";
import ProductManager from "../managers/ProductManager.js";

const router = express.Router();
const productManager = new ProductManager();

router.get("/", async (req, res) => {
  try {
    const products = await productManager.getAll();
    res.render("home", { products });
  } catch (err) {
    res.status(500).render("error", { error: err.message });
  }
});

router.get("/realtimeproducts", async (req, res) => {
  try {
    const products = await productManager.getAll();
    res.render("realTimeProducts", { products });
  } catch (err) {
    res.status(500).render("error", { error: err.message });
  }
});

export default router;






