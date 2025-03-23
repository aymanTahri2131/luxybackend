import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";

import productRoutes from "./routes/productRoutes.js"; 
import quotationRoutes from "./routes/quotationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

//app config

const app = express();
const port = process.env.PORT || 4000;
connectDB();

app.use(cors({
  origin: ["https://luxy-marbre.netlify.app", "http://localhost:3000"], // ✅ Remplace par l'URL Netlify
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

//middlewares

app.use(express.json());

//api endpoint

app.use("/api/products", productRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.listen(port, () => {
  console.log(`App is Running on ${port}`);
});
