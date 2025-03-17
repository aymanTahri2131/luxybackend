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

//middlewares

app.use(express.json());

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, token');

  // Intercepter les requêtes OPTIONS pour les requêtes préliminaires
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

//api endpoint

app.use("/api/products", productRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.listen(port, () => {
  console.log(`App is Running on ${port}`);
});
