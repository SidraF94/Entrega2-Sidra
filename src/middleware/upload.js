import multer from "multer";
import path from "path";

// Usar almacenamiento en memoria para convertir a Base64
const storage = multer.memoryStorage();

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

