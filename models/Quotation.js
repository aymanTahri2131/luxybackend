import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true, required: true },
    clientName: { type: String, required: true },
    clientPhone: { type: String, required: true },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        length: { type: Number, required: true }, // Longueur en mètres
        width: { type: Number, required: true }, // Largeur en mètres
        quantity: { type: Number, required: true },
        surface: { type: Number, required: true }, // Calculé comme length × width × quantity
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["en attente", "validé", "rejeté"], default: "en attente" },
  },
  { timestamps: true }
);

export default mongoose.model("Quotation", quotationSchema);
