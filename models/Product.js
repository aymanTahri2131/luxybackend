import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true, default: "Marbre" },
    unit: { type: String, required: true, default: "M²" },
    stock: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true }, // Prix au m² ou par unité
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
