import express from "express";
import adminController from "../controllers/adminController.js";
import upload from "../middleware/multer.js";
import authAdmin from "../middleware/authAdmin.js";
import artisanController from "../controllers/artisanController.js";

const {
  allUsers,
  findArtisanById,
  findServiceById,
  addArtisan,
  deleteArtisan,
  updateArtisan,
  addService,
  deleteService,
  updateService,
  loginAdmin,
  allArtisans,
  allServices,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
} = adminController;
const { changeAvailablity } = artisanController;

const adminRouter = express.Router();

adminRouter.post("/add-artisan", authAdmin, upload.single("image"), addArtisan);
adminRouter.put("/update-artisan", authAdmin, updateArtisan);
adminRouter.put("/update-service", authAdmin, updateService);
adminRouter.post("/add-service", authAdmin, upload.single("image"), addService);
adminRouter.post("/login", loginAdmin);
adminRouter.post("/all-artisans", authAdmin, allArtisans);
adminRouter.post("/all-users", authAdmin, allUsers);
adminRouter.post("/artisans/find", authAdmin, findArtisanById);
adminRouter.post("/services/find", authAdmin, findServiceById);
adminRouter.post("/delete-artisan", authAdmin, deleteArtisan);
adminRouter.post("/delete-service", authAdmin, deleteService);
adminRouter.post("/all-services", authAdmin, allServices);
adminRouter.post("/change-availability", authAdmin, changeAvailablity);
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel);
adminRouter.get("/dashboard", authAdmin, adminDashboard);
export default adminRouter;
