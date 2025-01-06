import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  artisanId: { type: String },
  userData: { type: Object, required: true },
  cart: {
    type: [
      {
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "service", required: true },
        serviceName: { type: String, required: true },
        servicePrice: { type: Number, required: true },
        quantity: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  option: {
    type: String,
    enum: ["immediate", "tomorrow", "later"], // Options disponibles
    required: true,
  },
  selectedDateTime: {
    type: Date, // Date et heure sélectionnées par l'utilisateur
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
  artisanData: { type: Object },
  createdAt: {
    type: Date,
    default: Date.now,
  },
},
  { timestamps: true }
);

const appointmentModel =
  mongoose.models.appointment ||
  mongoose.model("appointment", appointmentSchema);

export default appointmentModel;
