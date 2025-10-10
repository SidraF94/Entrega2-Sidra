import express from "express";
import productsRouter from "./routes/products.js";
import cartsRouter from "./routes/carts.js";

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware de parseo de JSON para req.body
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ estado: "ok", mensaje: "API en ejecución" });
});

// Implementación de las rutas separadas
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

export default app;


