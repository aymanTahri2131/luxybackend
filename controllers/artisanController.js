import artisanModel from "../models/artisanModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";

const changeAvailablity = async (req, res) => {
  try {
    const { artisanId } = req.body;
    const artisanData = await artisanModel.findById(artisanId);
    await artisanModel.findByIdAndUpdate(artisanId, {
      available: !artisanData.available,
    });
    res.json({ success: true, message: "Availablity changed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const artisanList = async (req, res) => {
  try {
    const artisans = await artisanModel.find({}).select(["-password,-email"]);
    res.json({ success: true, artisans });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API for artisan Login

const loginArtisan = async (req, res) => {
  try {
    const { email, password } = req.body;
    const artisan = await artisanModel.findOne({ email });

    if (!artisan) {
      return res.json({ success: false, message: "Invalid Credentials " });
    }

    const isMatch = await bcrypt.compare(password, artisan.password);

    if (isMatch) {
      const token = jwt.sign({ id: artisan._id }, process.env.JWT_SECRET);
      return res.json({ success: true, token });
    } else {
      return res.json({ success: false, message: "Incorrect Password" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get artisan appointments for artisan panel

const appointmentsArtisan = async (req, res) => {
  try {
    const { artisanId } = req.body;
    const appointments = await appointmentModel.find({ artisanId });

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to mark appointment completed for artisanpanel

const appointmentComplete = async (req, res) => {
  try {
    const { artisanId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.artisanId === artisanId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: true,
      });
      return res.json({ success: true, message: "Appointment completed" });
    } else {
      return res.json({ success: false, message: "Mark Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to cancel appointment  for artisanpanel

const appointmentCancel = async (req, res) => {
  try {
    const { artisanId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.artisanId === artisanId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });
      return res.json({ success: true, message: "Appointment Cancelled" });
    } else {
      return res.json({ success: false, message: "Cancellation Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get dahsboard data for artisan panel

const artisanDashboard = async (req, res) => {
  try {
    const { artisanId } = req.body;

    const appointments = await appointmentModel.find({ artisanId });
    let earnings = 0;
    appointments.map((item, index) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });

    let patients = [];

    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//API to get artisan profile for artisanpanel

const artisanProfile = async (req, res) => {
  try {
    const { artisanId } = req.body;
    const profileData = await artisanModel.findById(artisanId).select("-password");
    res.json({ success: true, profileData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//API to update artisan profile data from artisanpanel

const updateArtisanprofile = async (req, res) => {
  try {
    const { artisanId, address, available, experience, about } = req.body;

    await artisanModel.findByIdAndUpdate(artisanId, {
      address,
      available,
      experience,
      about,
    });

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default {
  changeAvailablity,
  artisanList,
  loginArtisan,
  appointmentsArtisan,
  appointmentCancel,
  appointmentComplete,
  artisanDashboard,
  artisanProfile,
  updateArtisanprofile,
};
