import express from "express";
import serviceController from "../controllers/serviceController.js";

const {serviceList} = serviceController;
const serviceRouter = express.Router();

serviceRouter.get("/list", serviceList);

export default serviceRouter;