import express from "express";
import artisanController from "../controllers/artisanController.js";
import authArtisan from "../middleware/authArtisan.js";

const {
  artisanList,
  loginArtisan,
  appointmentsArtisan,
  appointmentComplete,
  appointmentCancel,
  artisanDashboard,
  artisanProfile,
  updateArtisanprofile,
} = artisanController;
const artisanRouter = express.Router();

artisanRouter.get("/list", artisanList);
artisanRouter.post("/login", loginArtisan);
artisanRouter.get("/appointments", authArtisan, appointmentsArtisan);

artisanRouter.post("/complete-appointment", authArtisan, appointmentComplete);
artisanRouter.post("/cancel-appointment", authArtisan, appointmentCancel);
artisanRouter.get("/dashboard", authArtisan, artisanDashboard);
artisanRouter.get("/profile", authArtisan, artisanProfile);
artisanRouter.post("/update-profile", authArtisan, updateArtisanprofile);
export default artisanRouter;
