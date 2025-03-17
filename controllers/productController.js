import Product from "../models/Product.js";

// 🟢 Récupérer tous les produits
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Créer un produit
export const createProduct = async (req, res) => {
  try {
    const { name, type, unit, stock, price } = req.body;
    const newProduct = new Product({ name, type, unit, stock, price });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Mettre à jour un produit
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Supprimer un produit
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Produit supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
