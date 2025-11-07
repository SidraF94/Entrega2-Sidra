import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, "../data/images");

// configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, imagesDir);
  },
  filename: (req, file, callback) => {
    // Genero nombre único para el archivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    callback(null, `product-${uniqueSuffix}${ext}`);
  },
});

// filtro para aceptar solo imágenes
const fileFilter = (req, file, callback) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return callback(null, true);
  } else {
    callback(new Error("Solo se permiten archivos de imagen"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
  },
  fileFilter: fileFilter,
});

export default upload;

