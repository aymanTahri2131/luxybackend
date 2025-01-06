import express from "express";
import userController from "../controllers/userController.js";
import authUser from "../middleware/authUser.js";
import upload from "../middleware/multer.js";

const {
  userList,
  listAppointment,
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  cancelAppointment,
} = userController;
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.get("/list", userList);
userRouter.post("/login", loginUser);
userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfile
);

userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);


export default userRouter;
