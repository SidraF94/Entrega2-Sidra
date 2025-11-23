import express from "express";
import ProductManager from "../managers/ProductManager.js";
import CartManager from "../managers/CartManager.js";

const router = express.Router();
const productManager = new ProductManager();
const cartManager = new CartManager();

router.get("/", async (req, res) => {
  try {
    const products = await productManager.getAll();
    res.render("home", { products });
  } catch (err) {
    console.error("Error en GET /:", err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
});

router.get("/realtimeproducts", async (req, res) => {
  try {
    const products = await productManager.getAll();
    res.render("realTimeProducts", { products });
  } catch (err) {
    console.error("Error en GET /realtimeproducts:", err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
});

// Ruta para productos con paginación
router.get("/products", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const sort = req.query.sort;
    const query = req.query.query;

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

    res.render("products", {
      products: result.products,
      pagination: {
        totalPages: result.totalPages,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: prevLink,
        nextLink: nextLink,
        limit: limit,
        query: query || '',
        sort: sort || ''
      }
    });
  } catch (err) {
    console.error("Error en GET /products:", err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
});

// Ruta para detalles de un producto específico
router.get("/products/:pid", async (req, res) => {
  try {
    const product = await productManager.getById(req.params.pid);
    if (!product) {
      return res.status(404).send("<h1>Error 404</h1><p>Producto no encontrado</p>");
    }
    res.render("productDetail", { product });
  } catch (err) {
    console.error("Error en GET /products/:pid:", err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
});

// Ruta para ver un carrito específico
router.get("/carts/:cid", async (req, res) => {
  try {
    const cart = await cartManager.getById(req.params.cid);
    if (!cart) {
      return res.status(404).send("<h1>Error 404</h1><p>Carrito no encontrado</p>");
    }
    res.render("cart", { cart });
  } catch (err) {
    console.error("Error en GET /carts/:cid:", err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
});

export default router;