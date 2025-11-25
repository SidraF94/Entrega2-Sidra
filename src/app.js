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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const httpServer = createServer(app);
const io = new Server(httpServer);

app.engine("handlebars", engine({
  helpers: {
    eq: function(a, b) {
      return a === b;
    }
  }
}));
app.set("view engine", "handlebars");
app.set("views", "./src/views");

app.use(express.json());
app.use(express.static("./src/public"));

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/", viewsRouter);
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/api/images", imagesRouter);

app.use((err, req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({ 
      error: err.message || "Error interno del servidor",
      status: 'error'
    });
  }
  
  res.status(err.status || 500).send(`<h1>Error</h1><p>${err.message || "Error interno del servidor"}</p>`);
});

const productManager = new ProductManager();

io.on("connection", (socket) => {
  socket.on("newProduct", async (productData) => {
    try {
      const product = await productManager.add(productData);
      const productPlain = product.toObject({ virtuals: true });
      io.emit("productAdded", productPlain);
    } catch (error) {
      socket.emit("error", { message: "Error al agregar producto" });
    }
  });

  socket.on("deleteProduct", async (productId) => {
    try {
      const deleted = await productManager.delete(productId);
      if (deleted) {
        io.emit("productDeleted", productId);
      } else {
        socket.emit("error", { message: "Producto no encontrado" });
      }
    } catch (error) {
      socket.emit("error", { message: "Error al eliminar producto" });
    }
  });
});

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();

export { app, io };