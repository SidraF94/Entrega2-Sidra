import express from "express";
import ProductManager from "../managers/ProductManager.js";

const router = express.Router();
const productManager = new ProductManager();

// Ruta para servir imágenes desde Base64 almacenado en MongoDB
// Formato: /api/images/:productId/:thumbnailIndex
router.get("/:productId/:thumbnailIndex", async (req, res) => {
  try {
    const productId = req.params.productId;
    const thumbnailIndex = parseInt(req.params.thumbnailIndex);
    
    const product = await productManager.getById(productId);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (!product.thumbnails || !product.thumbnails[thumbnailIndex]) {
      return res.status(404).json({ error: "Imagen no encontrada" });
    }

    const thumbnail = product.thumbnails[thumbnailIndex];
    
    // Convertir Base64 a buffer y enviar
    const imageBuffer = Buffer.from(thumbnail.data, 'base64');
    res.set('Content-Type', thumbnail.contentType);
    res.send(imageBuffer);
  } catch (error) {
    console.error("Error en GET /api/images/:productId/:thumbnailIndex:", error);
    res.status(500).json({ error: "Error al obtener imagen" });
  }
});

export default router;
