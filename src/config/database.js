import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/backend-i";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado a MongoDB");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error.message);
    process.exit(1);
  }
};

mongoose.connection.on("error", (error) => {
  console.error("Error de MongoDB:", error);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB desconectado");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB desconectado debido a terminación de la aplicación");
  process.exit(0);
});

