import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { engine } from "express-handlebars";
import productsRouter from "./routes/products.js";
import cartsRouter from "./routes/carts.js";
import viewsRouter from "./routes/views.router.js";
import ProductManager from "./managers/ProductManager.js";

const app = express();
const PORT = 8080;

// Crear servidor HTTP
const httpServer = createServer(app);

// Configuracion Socket.io
const io = new Server(httpServer);

// Configuraxion Handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./src/views");

// Middleware de parseo de JSON para req.body
app.use(express.json());

// Middleware para servir archivos estáticos
app.use(express.static("./src/public"));
// Servir imágenes desde data/images
app.use("/images", express.static("./src/data/images"));

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

httpServer.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

export { app, io };


