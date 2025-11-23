import express from "express";
import ProductManager from "../managers/ProductManager.js";
import upload from "../middleware/upload.js";

const router = express.Router();
const productManager = new ProductManager();

// Rutas de productos
router.get("/", async (req, res) => {
  try {
    // Obtener query params
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const sort = req.query.sort; // 'asc' o 'desc'
    const query = req.query.query; // filtro por categoría o disponibilidad

    // Obtener productos paginados
    const result = await productManager.getPaginated({ limit, page, sort, query });

    // Construir URLs de paginación
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
    const queryParams = new URLSearchParams();
    
    if (limit !== 10) queryParams.append('limit', limit);
    if (query) queryParams.append('query', query);
    if (sort) queryParams.append('sort', sort);
    
    const prevLink = result.hasPrevPage 
      ? `${baseUrl}?${queryParams.toString()}&page=${result.prevPage}`
      : null;
    
    const nextLink = result.hasNextPage
      ? `${baseUrl}?${queryParams.toString()}&page=${result.nextPage}`
      : null;

    // Formato de respuesta requerido
    res.json({
      status: 'success',
      payload: result.products,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: prevLink,
      nextLink: nextLink
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error',
      error: err.message || "Error interno del servidor" 
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    // Validar formato de ID
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    const product = await productManager.getById(req.params.id);
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch (err) {
    console.error("Error en GET /api/products/:id:", err);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.post("/", upload.array("thumbnails", 5), async (req, res) => {
  try {
    // Validar campos requeridos
    const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Campos requeridos faltantes: ${missingFields.join(', ')}` 
      });
    }

    // Validar tipos de datos
    const price = parseFloat(req.body.price);
    const stock = parseInt(req.body.stock);

    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: "El precio debe ser un número mayor o igual a 0" });
    }

    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ error: "El stock debe ser un número mayor o igual a 0" });
    }

    // Convertir imágenes a Base64 y guardarlas en el documento
    const thumbnails = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Convertir buffer a Base64
        const base64Data = file.buffer.toString('base64');
        thumbnails.push({
          data: base64Data,
          contentType: file.mimetype,
          filename: file.originalname
        });
      }
    }
    
    // parsear status correctamente
    let status = true;
    if (req.body.status !== undefined) {
      status = req.body.status === "true" || req.body.status === true || req.body.status === "1";
    }
    
    const productData = {
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      code: req.body.code.trim(),
      price: price,
      stock: stock,
      category: req.body.category.trim(),
      status: status,
      thumbnails: thumbnails
    };

    console.log("Datos del producto recibidos:", productData);

    const product = await productManager.add(productData);
    console.log("Producto creado:", product);
    
    // emit para actualizar cliente en tiempo real
    if (req.io) {
      req.io.emit("productAdded", product);
      console.log("productAdded emitido para producto:", product.id);
    }
    
    res.status(201).json(product);
  } catch (err) {
    console.error("Error en POST /api/products:", err);
    
    // Manejar errores específicos de validación de Mongoose
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: `Error de validación: ${errors.join(', ')}` });
    }
    
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.put("/:id", upload.array("thumbnails", 5), async (req, res) => {
  try {
    // Validar que el ID sea válido
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    // Obtener producto actual para mantener imágenes existentes
    const currentProduct = await productManager.getById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    let thumbnails = currentProduct.thumbnails || [];
    
    // Convertir nuevas imágenes a Base64
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const base64Data = file.buffer.toString('base64');
        thumbnails.push({
          data: base64Data,
          contentType: file.mimetype,
          filename: file.originalname
        });
      }
    }

    // Validar y preparar datos de actualización
    const updateData = { ...req.body };
    
    // Validar precio si se proporciona
    if (updateData.price !== undefined) {
      const price = parseFloat(updateData.price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: "El precio debe ser un número mayor o igual a 0" });
      }
      updateData.price = price;
    }

    // Validar stock si se proporciona
    if (updateData.stock !== undefined) {
      const stock = parseInt(updateData.stock);
      if (isNaN(stock) || stock < 0) {
        return res.status(400).json({ error: "El stock debe ser un número mayor o igual a 0" });
      }
      updateData.stock = stock;
    }

    // Validar status si se proporciona
    if (updateData.status !== undefined) {
      updateData.status = updateData.status === "true" || updateData.status === true || updateData.status === "1";
    }

    // Agregar thumbnails al objeto de actualización
    updateData.thumbnails = thumbnails;

    const updated = await productManager.update(req.params.id, updateData);
    if (!updated) return res.status(404).json({ error: "Producto no encontrado" });
    
    // Emitir evento WebSocket para actualizar clientes en tiempo real
    if (req.io) {
      req.io.emit("productUpdated", updated);
    }
    console.log("Producto modificado exitosamente.");
    res.json(updated);
  } catch (err) {
    console.error("Error en PUT /api/products/:id:", err);
    
    // Manejar errores específicos de validación de Mongoose
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: `Error de validación: ${errors.join(', ')}` });
    }
    
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    // Validar formato de ID
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    const ok = await productManager.delete(req.params.id);
    if (!ok) return res.status(404).json({ error: "Producto no encontrado" });
    
    // Emitir evento WebSocket para actualizar clientes en tiempo real
    if (req.io) {
      req.io.emit("productDeleted", req.params.id);
    }
    console.log("Producto eliminado correctamente");
    res.status(200).json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("Error en DELETE /api/products/:id:", err);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

export default router;
