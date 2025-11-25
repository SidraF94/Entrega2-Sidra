import express from "express";
import ProductManager from "../managers/ProductManager.js";
import upload from "../middleware/upload.js";

const router = express.Router();
const productManager = new ProductManager();

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const sort = req.query.sort;
    const query = req.query.query;

    const result = await productManager.getPaginated({ limit, page, sort, query });

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
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    const product = await productManager.getById(req.params.id);
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.post("/", upload.array("thumbnails", 5), async (req, res) => {
  try {
    const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Campos requeridos faltantes: ${missingFields.join(', ')}` 
      });
    }

    const price = parseFloat(req.body.price);
    const stock = parseInt(req.body.stock);

    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: "El precio debe ser un número mayor o igual a 0" });
    }

    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ error: "El stock debe ser un número mayor o igual a 0" });
    }

    const thumbnails = [];
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

    const product = await productManager.add(productData);
    const productPlain = product.toObject();
    productPlain._id = productPlain._id.toString();
    
    if (req.io) {
      req.io.emit("productAdded", productPlain);
    }
    
    res.status(201).json(productPlain);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: `Error de validación: ${errors.join(', ')}` });
    }
    
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.put("/:id", upload.array("thumbnails", 5), async (req, res) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    const currentProduct = await productManager.getById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    let thumbnails = currentProduct.thumbnails || [];
    
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

    const updateData = { ...req.body };
    
    if (updateData.price !== undefined) {
      const price = parseFloat(updateData.price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: "El precio debe ser un número mayor o igual a 0" });
      }
      updateData.price = price;
    }

    if (updateData.stock !== undefined) {
      const stock = parseInt(updateData.stock);
      if (isNaN(stock) || stock < 0) {
        return res.status(400).json({ error: "El stock debe ser un número mayor o igual a 0" });
      }
      updateData.stock = stock;
    }

    if (updateData.status !== undefined) {
      updateData.status = updateData.status === "true" || updateData.status === true || updateData.status === "1";
    }

    updateData.thumbnails = thumbnails;

    const updated = await productManager.update(req.params.id, updateData);
    if (!updated) return res.status(404).json({ error: "Producto no encontrado" });
    
    const updatedPlain = updated.toObject();
    updatedPlain._id = updatedPlain._id.toString();
    
    if (req.io) {
      req.io.emit("productUpdated", updatedPlain);
    }
    res.json(updatedPlain);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: `Error de validación: ${errors.join(', ')}` });
    }
    
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    const ok = await productManager.delete(req.params.id);
    if (!ok) return res.status(404).json({ error: "Producto no encontrado" });
    
    if (req.io) {
      req.io.emit("productDeleted", req.params.id);
    }
    res.status(200).json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

export default router;
