import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { engine } from "express-handlebars";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import productsRouter from "./routes/products.js";
import cartsRouter from "./routes/carts.js";
import viewsRouter from "./routes/views.router.js";
import imagesRouter from "./routes/images.js";
import ProductManager from "./managers/ProductManager.js";

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Crear servidor HTTP
const httpServer = createServer(app);

// Configuracion Socket.io
const io = new Server(httpServer);

// Configuraxion Handlebars con helpers
app.engine("handlebars", engine({
  helpers: {
    eq: function(a, b) {
      return a === b;
    },
    gt: function(a, b) {
      return a > b;
    },
    multiply: function(a, b) {
      return a * b;
    },
    calculateTotal: function(products) {
      let total = 0;
      if (products && Array.isArray(products)) {
        products.forEach(item => {
          if (item.productId && item.productId.price && item.quantity) {
            total += item.productId.price * item.quantity;
          }
        });
      }
      return total;
    }
  }
}));
app.set("view engine", "handlebars");
app.set("views", "./src/views");

// Middleware de parseo de JSON para req.body
app.use(express.json());

// Middleware para servir archivos estáticos
app.use(express.static("./src/public"));

// Pasamos io a las rutas mediante req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Router de vistas
app.use("/", viewsRouter);

// Implementamos de las rutas separadas
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/api/images", imagesRouter);

// Middleware de manejo de errores global (debe ir al final, con 4 parámetros)
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  
  // Si es una ruta API, devolver JSON
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({ 
      error: err.message || "Error interno del servidor",
      status: 'error'
    });
  }
  
  // Si es una ruta de vista, enviar HTML simple (no renderizar vista que no existe)
  res.status(err.status || 500).send(`<h1>Error</h1><p>${err.message || "Error interno del servidor"}</p>`);
});

// Instancia de ProductManager para usar en los handlers de socket
const productManager = new ProductManager();

// Configurar Socket.io
io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  // Manejar creación de producto vía WebSocket
  socket.on("newProduct", async (productData) => {
    try {
      const product = await productManager.add(productData);
      // Emitir a todos los clientes conectados
      io.emit("productAdded", product);
      console.log("Producto agregado:", product.id);
    } catch (error) {
      console.error("Error al agregar producto:", error);
      socket.emit("error", { message: "Error al agregar producto" });
    }
  });

  // Manejar eliminación de producto vía WebSocket
  socket.on("deleteProduct", async (productId) => {
    try {
      const deleted = await productManager.delete(productId);
      if (deleted) {
        // Emitir a todos los clientes conectados
        io.emit("productDeleted", productId);
        console.log("Producto eliminado:", productId);
      } else {
        socket.emit("error", { message: "Producto no encontrado" });
      }
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      socket.emit("error", { message: "Error al eliminar producto" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// Iniciar servidor después de conectar a la base de datos
const startServer = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();
    
    // Iniciar servidor HTTP
    httpServer.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

// Iniciar aplicación
startServer();

export { app, io };


