import express from "express";
import ProductManager from "../managers/ProductManager.js";
import upload from "../middleware/upload.js";

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

router.post("/", upload.array("thumbnails", 5), async (req, res) => {
  try {
    // procesar imágenes subidas
    const thumbnails = req.files ? req.files.map(file => `/images/${file.filename}`) : [];
    
    // parsear status correctamente
    let status = true;
    if (req.body.status !== undefined) {
      status = req.body.status === "true" || req.body.status === true || req.body.status === "1";
    }
    
    const productData = {
      title: req.body.title,
      description: req.body.description,
      code: req.body.code,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock),
      category: req.body.category,
      status: status,
      thumbnails: thumbnails.length > 0 ? thumbnails : []
    };

    console.log("Datos del producto recibidos:", productData);

    const product = await productManager.add(productData);
    console.log("Producto creado:", product);
    
    // emit para actualizar cliente en tiempo real
    if (req.io) {
      req.io.emit("productAdded", product);
      console.log("productAdded emitido para producto:", product.id);
    } else {
      console.log("req.io no funciona");
    }
    
    res.status(201).json(product);
  } catch (err) {
    console.error("Error en POST /api/products:", err);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.put("/:id", upload.array("thumbnails", 5), async (req, res) => {
  try {
    // Procesar imágenes subidas
    const newThumbnails = req.files ? req.files.map(file => `/images/${file.filename}`) : [];
    
    // Combinar imágenes nuevas con las existentes si se proporcionan
    let thumbnails = [];
    if (req.body.thumbnails) {
      try {
        thumbnails = JSON.parse(req.body.thumbnails);
      } catch {
        thumbnails = Array.isArray(req.body.thumbnails) ? req.body.thumbnails : [];
      }
    }
    
    // Agregar nuevas imágenes si hay
    thumbnails = [...thumbnails, ...newThumbnails];

    // Crear objeto de actualización
    const updateData = {
      ...req.body,
      thumbnails: thumbnails.length > 0 ? thumbnails : undefined
    };
    
    // Eliminar thumbnails del body si no se proporcionó
    if (!updateData.thumbnails) {
      delete updateData.thumbnails;
    }

    const updated = await productManager.update(req.params.id, updateData);
    if (!updated) return res.status(404).json({ error: "Producto no encontrado" });
    // Emitir evento WebSocket para actualizar clientes en tiempo real
    if (req.io) {
      req.io.emit("productUpdated", updated);
    }
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
    // Emitir evento WebSocket para actualizar clientes en tiempo real
    if (req.io) {
      req.io.emit("productDeleted", req.params.id);
    }
    console.log("Producto eliminado correctamente");
    res.status(200).json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

export default router;
