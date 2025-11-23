import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: Boolean,
    default: true
  },
  thumbnails: {
    type: [
      {
        data: {
          type: String, // Base64 string de la imagen
          required: true
        },
        contentType: {
          type: String, // image/jpeg, image/png, etc.
          required: true
        },
        filename: {
          type: String,
          required: true
        }
      }
    ],
    default: []
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

const Product = mongoose.model("Product", productSchema);

export default Product;

