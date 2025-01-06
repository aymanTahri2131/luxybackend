import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import artisanRouter from "./routes/artisanRoute.js";
import serviceRouter from "./routes/serviceRoutes.js";
import userRouter from "./routes/userRoutes.js";

//app config

const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

//middlewares

app.use(express.json());

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, token, atoken, rtoken');

  // Intercepter les requêtes OPTIONS pour les requêtes préliminaires
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

//api endpoint

app.use("/api/admin", adminRouter);
app.use("/api/artisan", artisanRouter);
app.use("/api/service", serviceRouter);
app.use("/api/user", userRouter);
//localhost:4000/api/admin

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.listen(port, () => {
  console.log(`App is Running on ${port}`);
});
