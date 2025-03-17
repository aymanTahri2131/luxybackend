import User from "../models/User.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// 🟢 Inscription
export const registerUser = async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "Utilisateur déjà existant" });

  const user = await User.create({ name, email, phone, password, role });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: "Erreur d'inscription" });
  }
};

// 🟢 Connexion
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: "Email ou mot de passe invalide" });
  }
};

// 🟢 Récupération des utilisateurs (Admin seulement)
export const getUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};
