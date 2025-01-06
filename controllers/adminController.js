import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import artisanModel from "../models/artisanModel.js";
import serviceModel from '../models/serviceModel.js';
import userModel from '../models/userModel.js';
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";

//Api for adding artisan

const findArtisanById = async (req, res) => {
  try {
    const { id } = req.body; // L'ID est récupéré depuis le body

    if (!id) {
      return res.status(400).json({ success: false, message: "Artisan ID is required" });
    }

    const artisan = await artisanModel.findById(id).select("-password");

    if (!artisan) {
      return res.status(404).json({ success: false, message: "Artisan not found" });
    }

    res.status(200).json({ success: true, artisan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const addArtisan = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      speciality,
      degree,
      experience,
      about,
      address,
    } = req.body;
    const imageFile = req.file;

    // checking for all data to add artisan

    if (
      !name ||
      !email ||
      !password ||
      !phone
    ) {
      return res.json({ success: false, message: "Missing Details" });
    }

    //validating email format

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    //validating phone

    if (phone.length < 10) {
      return res.json({
        success: false,
        message: "Please enter a valid phone number",
      });
    }

    //validating strong password

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a Strong Password",
      });
    }

    //hashing artisan password

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //upload image to cloudinary

    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    const imageUrl = imageUpload.secure_url;

    //To save data in database
    const artisanData = {
      name,
      email,
      phone,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      address: JSON.parse(address),
      date: Date.now(),
    };

    const newArtisan = new artisanModel(artisanData);
    await newArtisan.save();

    res.json({ success: true, message: "Artisan Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const deleteArtisan = async (req, res) => {
  try {
    const { artisanId } = req.body; // Récupère l'ID de l'artisan depuis le corps de la requête

    if (!artisanId) {
      return res.json({ success: false, message: "Artisan ID is required" });
    }

    // Vérifier si l'artisan existe
    const artisan = await artisanModel.findById(artisanId);
    if (!artisan) {
      return res.json({ success: false, message: "Artisan not found" });
    }

    // Supprimer l'artisan
    await artisanModel.findByIdAndDelete(artisanId);

    res.json({ success: true, message: "Artisan deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateArtisan = async (req, res) => {
  try {
    const { id, name, email, phone, speciality, address, experience, available } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "Artisan ID is required" });
    }

    const artisan = await artisanModel.findById(id);

    if (!artisan) {
      return res.status(404).json({ success: false, message: "Artisan not found" });
    }

    // Mise à jour des champs
    artisan.name = name || artisan.name;
    artisan.email = email || artisan.email;
    artisan.phone = phone || artisan.phone;
    artisan.speciality = speciality || artisan.speciality;
    artisan.address = address || artisan.address;
    artisan.available = available !== undefined ? available : artisan.available;
    artisan.experience = experience || artisan.experience;

    await artisan.save();

    res.status(200).json({ success: true, message: "Artisan updated successfully", artisan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const findServiceById = async (req, res) => {
  try {
    const { id } = req.body; // L'ID est récupéré depuis le body

    if (!id) {
      return res.status(400).json({ success: false, message: "Service ID is required" });
    }

    const service = await serviceModel.findById(id);

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    res.status(200).json({ success: true, service });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const addService = async (req, res) => {
  try {
    const {
      name,
      speciality,
      amount
    } = req.body;
    const imageFile = req.file;

    // checking for all data to add service

    if (
      !name ||
      !speciality ||
      speciality === " "
    ) {
      return res.json({ success: false, message: "Missing Details" });
    }

    //upload image to cloudinary

    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    const imageUrl = imageUpload.secure_url;

    //To save data in database
    const serviceData = {
      name,
      image: imageUrl,
      speciality,
      amount
    };

    const newService = new serviceModel(serviceData);
    await newService.save();

    res.json({ success: true, message: "service Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const { id, name, speciality, amount } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "Service ID is required" });
    }

    const service = await serviceModel.findById(id);

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // Mise à jour des champs
    service.name = name || service.name;
    service.speciality = speciality || service.speciality;
    service.amount = amount || service.amount;

    await service.save();

    res.status(200).json({ success: true, message: "Service updated successfully", service });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.body; // Récupère l'ID de service depuis le corps de la requête

    if (!serviceId) {
      return res.json({ success: false, message: "Service ID is required" });
    }

    // Vérifier si l'artisan existe
    const service = await serviceModel.findById(serviceId);
    if (!service) {
      return res.json({ success: false, message: "Service not found" });
    }

    // Supprimer l'artisan
    await serviceModel.findByIdAndDelete(serviceId);

    res.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API for admin login

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email == process.env.ADMIN_EMAIL &&
      password == process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all artisans list for admin panel

const allArtisans = async (req, res) => {
  try {
    const artisans = await artisanModel.find({}).select("-password");
    res.json({ success: true, artisans });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const allServices = async (req, res) => {
  try {
    const services = await serviceModel.find({});
    res.json({ success: true, services });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const allUsers = async (req, res) => {
  try {
    const users = await userModel.find({});
    res.json({ success: true, users });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
//API to get all appointment list

const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API for appointment cancellation

const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      status: "cancelled",
    });
    res.json({ success: true, message: "Appointment cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get dashboard data for adminpanel

const adminDashboard = async (req, res) => {
  try {
    const artisans = await artisanModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    const dashData = {
      artisans: artisans.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export default {
  allUsers,
  findArtisanById,
  addArtisan,
  deleteArtisan,
  updateArtisan,
  findServiceById,
  addService,
  updateService,
  deleteService,
  loginAdmin,
  allArtisans,
  allServices,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
};
