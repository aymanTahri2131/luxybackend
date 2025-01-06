import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import artisanModel from "../models/artisanModel.js";
import serviceModel from "../models/serviceModel.js";
import appointmentModel from "../models/appointmentModel.js";
// api to register user

const registerUser = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.json({ success: false, message: "missing details" });
    }

    //validating strong password
    if (password.length < 8) {
      return res.json({ success: false, message: "Enater a strong password" });
    }

    //hashing user password

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      phone,
      password: hashedPassword,
    };

    const newuser = new userModel(userData);
    const user = await newuser.save();

    //_id
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API for user login

const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await userModel.findOne({ phone });

    if (!user) {
      return res.json({ success: false, message: "user does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get user profile Data

const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//APi to update user profile

const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address } = req.body;
    const imgFile = req.file;
    if (!name || !phone ) {
      return res.json({ success: false, message: "Data Missing" });
    }
    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
    });
    if (imgFile) {
      //upload image to cloudinary

      const imageUpload = await cloudinary.uploader.upload(imgFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to Book Appointment

const bookAppointment = async (req, res) => {
  try {
    const { userId, cart, totalAmount, option, selectedDateTime } = req.body;

    if (!cart || !totalAmount || !option || !selectedDateTime) {
      return res.status(400).json({
        success: false,
        message: "Manque d'infos !",
      });
    }

    const userData = await userModel.findById(userId).select("-password");

    const appointmentData = {
      userId,
      cart,
      totalAmount,
      option,
      selectedDateTime,
      userData,
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    res.json({ success: true, message: "Appointment Booked" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get user appointments for frontend my-appointments page

const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });
    console.log(appointments);

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to cancel to appointment

const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    console.log(appointmentId);

    const appointmentData = await appointmentModel.findById(appointmentId);
    //checking user same as appointment use
    if (userId !== appointmentData.userId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    res.json({ success: true, message: "Appointment cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const userList = async (req, res) => {
  try {
    const users = await userModel.find({});
    res.json({ success: true, users });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


export default {
  userList,
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
};
