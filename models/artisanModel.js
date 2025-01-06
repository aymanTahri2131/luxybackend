import mongoose from "mongoose";

const artisanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String },
    speciality: { type: String },
    degree: { type: String},
    experience: { type: String },
    about: { type: String },
    available: { type: Boolean, default: true },
    address: { type: Object },
    slots_booked: { type: Object, default: {} },
  },
  { minimize: false }
  //minimize:false makes can create empty object
  //minimize:true makes can't create empty object
);

const artisanModel =
  mongoose.models.artisan || mongoose.model("artisan", artisanSchema);

export default artisanModel;
