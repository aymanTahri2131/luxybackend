import Product from "../models/Product.js";
import Quotation from "../models/Quotation.js";

// 🟢 Récupérer les statistiques du Dashboard
export const getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalQuotations = await Quotation.countDocuments();
        const totalValidated = await Quotation.countDocuments({ status: "validé" });
        const totalRejected = await Quotation.countDocuments({ status: "rejeté" });
        const totalValidatedAmount = await Quotation.aggregate([
            { $match: { status: "validé" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);

        const validatedAmount = totalValidatedAmount.length > 0 ? totalValidatedAmount[0].total : 0;

        res.status(200).json({
            totalProducts,
            totalQuotations,
            totalValidated,
            totalRejected,
            totalValidatedAmount: validatedAmount,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🟢 Récupérer l'évolution des devis créés par mois
const MONTHS = [
    "Jan", "Fév", "Mrs", "Avr", "Mai", "Juin",
    "Jui", "Août", "Sep", "Oct", "Nov", "Déc"
  ];
  
  // 🟢 Récupérer le nombre de devis créés par mois (sur 12 mois)
  export const getQuotationsStats = async (req, res) => {
    try {
      const stats = await Quotation.aggregate([
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]);
  
      // Créer un tableau avec les 12 mois et remplir avec les valeurs obtenues
      const formattedStats = MONTHS.map((month, index) => {
        const stat = stats.find((s) => s._id.month === index + 1);
        return {
          month, 
          count: stat ? stat.count : 0
        };
      });
  
      res.status(200).json(formattedStats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  export const getQuotationTypeStats = async (req, res) => {
    try {
      const stats = await Quotation.aggregate([
        {
          $group: {
            _id: "$type", // "client" ou "fournisseur"
            count: { $sum: 1 },
          },
        },
      ]);
  
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors du calcul des statistiques" });
    }
  };
  

  export const getLowStockProducts = async (req, res) => {
    try {
      const lowStockProducts = await Product.find({ stock: { $lt: 10 } }).select("name stock");
  
      res.status(200).json(lowStockProducts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  export const getOutOfStockCount = async (req, res) => {
    try {
      const outOfStockCount = await Product.countDocuments({ stock: 0 });
  
      res.status(200).json({ outOfStockCount });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// 🟢 Récupérer la répartition des devis par statut
export const getQuotationsByStatus = async (req, res) => {
    try {
        const stats = await Quotation.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
