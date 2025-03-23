import Quotation from "../models/Quotation.js";
import Product from "../models/Product.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// 🟢 Création d'un devis avec gestion des dimensions et calcul automatique de la surface

// 🟢 Génération d'une référence unique pour le devis
const generateReference = async () => {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

  const count = await Quotation.countDocuments();
  const reference = `${formattedDate}${String(count + 1).padStart(3, "0")}`;

  return reference;
};

// 🟢 Création d'un devis avec référence automatique
export const createQuotation = async (req, res) => {
  try {
    const { clientName, clientPhone, products, type } = req.body;
    const reference = await generateReference();

    let totalAmount = 0;
    const quotationProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: "Produit non trouvé" });

      const surface = item.length * item.width * item.quantity; // Calcul de la surface totale
      const totalPrice = surface * product.price;
      totalAmount += totalPrice;

      quotationProducts.push({
        productId: product._id,
        length: item.length,
        width: item.width,
        quantity: item.quantity,
        surface,
        unitPrice: product.price,
        totalPrice,
      });
    }

    const quotation = new Quotation({ reference, clientName, clientPhone, products: quotationProducts, totalAmount, type });
    await quotation.save();

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Rechercher un devis par référence avec MongoDB Atlas Search
export const searchQuotations = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Aucun terme de recherche fourni." });
    }

    const results = await Quotation.aggregate([
      {
        $search: {
          index: "default", // 🔹 Assure-toi que ce nom correspond à l'index créé dans Atlas
          wildcard: {
            query: `*${query}*`,
            path: ["reference", "clientName"],
            allowAnalyzedField: true,
          },
        },
      },
    ]);

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Modifier le statut d'un devis
export const updateQuotationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["en attente", "validé", "rejeté"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    // 🔹 Trouver le devis et charger les produits liés
    const quotation = await Quotation.findById(id).populate("products.productId");
    if (!quotation) {
      return res.status(404).json({ message: "Devis introuvable" });
    }

    // 🔹 Vérifier si le devis passe en "validé" et ajuster le stock
    if (status === "validé" && quotation.status !== "validé") {
      for (let item of quotation.products) {
        const product = await Product.findById(item.productId._id);

        if (product) {
          const newStock = product.stock - item.surface; // 🔹 Soustraction de la surface totale

          if (newStock < 0) {
            return res.status(400).json({
              message: `Stock insuffisant pour ${product.name}. Stock actuel: ${product.stock}, demandé: ${item.surface}`,
            });
          }

          product.stock = newStock;
          await product.save();
        } else {
          return res.status(404).json({ message: `Produit introuvable pour l'ID: ${item.productId._id}` });
        }
      }
    }

    // 🔹 Mettre à jour le statut du devis
    quotation.status = status;
    await quotation.save();

    res.status(200).json({ message: "Statut du devis mis à jour avec succès.", quotation });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du devis:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};



// 🟢 Récupérer tous les devis
export const getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find().populate("products.productId");
    res.status(200).json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Génération d'un devis en PDF avec les nouvelles colonnes
export const generateQuotationPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id).populate("products.productId");

    if (!quotation) return res.status(404).json({ message: "Devis introuvable" });

    // 📂 Création du dossier "pdf" si inexistant
    const pdfDir = path.resolve("pdf");
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir);
    }

    // 📄 Définition du fichier PDF
    const doc = new PDFDocument({ size: "A4", margin: 20 });
    const filename = `Devis_${id}.pdf`;
    const filePath = path.join(pdfDir, filename);

    doc.pipe(fs.createWriteStream(filePath)); // Sauvegarde sur serveur
    doc.pipe(res); // Envoi au client

    // ✅ Logo
    const logoPath = path.join("assets", "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 420, 40, { width: 100 });
    }

    // ✅ Infos de l'entreprise
    doc.font("Helvetica-Bold").fontSize(13).text("LUXY MARBRE SARL", 50, 40);
    doc.font("Helvetica").fontSize(8)
      .text("TEL: 0661336617", 50, 72)
      .text("TEL: 0603020343", 50, 84)
      .text("Route Driouch Bentaib", 50, 60);

    // ✅ Titre Centré
    doc.moveDown(5);
    doc.font("Helvetica-Bold").fontSize(14).text(`Devis: ${quotation.reference}`, { align: "center" });
    doc.moveDown(2);

    // ✅ Infos du Client
    const formattedDate = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    doc.font("Helvetica-Bold").fontSize(10).text("Client :", { underline: true }).moveDown(1);
    doc.font("Helvetica").fontSize(10)
      .text(`Nom: ${quotation.clientName}`)
      .text(`Téléphone: ${quotation.clientPhone}`)
      .text(`Date: ${formattedDate}`)
      .moveDown(1);

    // ✅ Tableau des Produits
    doc.font("Helvetica-Bold").fontSize(10).text("Produits :", { underline: true });
    doc.moveDown(0.5);

    const startX = 50;
    let y = doc.y;
    const columnWidths = { designation: 120, length: 50, width: 50, qty: 50, surface: 80, unitPrice: 70, total: 80 };

    // ✅ En-tête du tableau
    const rowHeight = 20;
    doc.rect(startX, y, columnWidths.designation, rowHeight).fill("#000").stroke("white");
    doc.rect(startX + columnWidths.designation, y, columnWidths.length, rowHeight).fill("#000").stroke("white");
    doc.rect(startX + columnWidths.designation + columnWidths.length, y, columnWidths.width, rowHeight).fill("#000").stroke("white");
    doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width, y, columnWidths.qty, rowHeight).fill("#000").stroke("white");
    doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty, y, columnWidths.surface, rowHeight).fill("#000").stroke("white");
    doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface, y, columnWidths.unitPrice, rowHeight).fill("#000").stroke("white");
    doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface + columnWidths.unitPrice, y, columnWidths.total, rowHeight).fill("#000").stroke("white");

    doc.fillColor("white").font("Helvetica-Bold").fontSize(10);
    doc.text("Désignation", startX + 5, y + 7, { width: columnWidths.designation });
    doc.text("Long", startX + columnWidths.designation + 5, y + 7, { width: columnWidths.length, align: "center" });
    doc.text("larg", startX + columnWidths.designation + columnWidths.length + 5, y + 7, { width: columnWidths.width, align: "center" });
    doc.text("Qté", startX + columnWidths.designation + columnWidths.length + columnWidths.width + 5, y + 7, { width: columnWidths.qty, align: "center" });
    doc.text("Surface", startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + 5, y + 7, { width: columnWidths.surface, align: "center" });
    doc.text("Prix U.", startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface + 5, y + 7, { width: columnWidths.unitPrice, align: "center" });
    doc.text("Total", startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface + columnWidths.unitPrice + 5, y + 7, { width: columnWidths.total, align: "center" });
    doc.fillColor("black");

    y += rowHeight;

    doc.font("Helvetica").fontSize(8);

    quotation.products.forEach((item) => {
      const productName = item.productId?.name || "Produit inconnu";
      const productDetails = `${productName}`;

      doc.rect(startX, y, columnWidths.designation, rowHeight).stroke("gray");
      doc.rect(startX + columnWidths.designation, y, columnWidths.length, rowHeight).stroke();
      doc.rect(startX + columnWidths.designation + columnWidths.length, y, columnWidths.width, rowHeight).stroke();
      doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width, y, columnWidths.qty, rowHeight).stroke();
      doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty, y, columnWidths.surface, rowHeight).stroke();
      doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface, y, columnWidths.unitPrice, rowHeight).stroke();
      doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface + columnWidths.unitPrice, y, columnWidths.total, rowHeight).stroke();

      // ✅ Vérifier si le texte est trop long, et réduire dynamiquement la taille
      let textSize = 10;
      if (doc.widthOfString(productDetails) > columnWidths.designation - 10) {
        textSize = 8; // Réduire la taille du texte si nécessaire
      }

      doc.fontSize(textSize);
      doc.text(productDetails, startX + 5, y + 7, { width: columnWidths.designation, ellipsis: true }); // Empêcher le retour à la ligne

      doc.fontSize(10);
      doc.text(`${item.length.toFixed(2)} m`, startX + columnWidths.designation + 5, y + 7, { width: columnWidths.length, align: "center" });
      doc.text(`${item.width.toFixed(2)} m`, startX + columnWidths.designation + columnWidths.length + 5, y + 7, { width: columnWidths.width, align: "center" });
      doc.text(item.quantity.toFixed(2), startX + columnWidths.designation + columnWidths.length + columnWidths.width + 5, y + 7, { width: columnWidths.qty, align: "center" });
      doc.text(`${item.surface.toFixed(2)} m²`, startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + 5, y + 7, { width: columnWidths.surface, align: "center" });
      doc.text(`${item.unitPrice.toFixed(2)} DH`, startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface + 5, y + 7, { width: columnWidths.unitPrice, align: "center" });
      doc.text(`${item.totalPrice.toFixed(2)} DH`, startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface + columnWidths.unitPrice + 5, y + 7, { width: columnWidths.total, align: "center" });

      y += rowHeight;
    });

    // ✅ Tableau Total H.T, Payé, Reste à payer
    y += 30; // Espacement après le tableau des produits
    doc.font("Helvetica-Bold").fontSize(10).text("Récapitulatif :", startX, y, { underline: true });
    y += 20;

    const totalColumnWidths = { label: 200, value: 100 };

    // ✅ En-tête du tableau
    doc.rect(startX, y, totalColumnWidths.label, rowHeight).fill("#000").stroke();
    doc.rect(startX + totalColumnWidths.label, y, totalColumnWidths.value + 20, rowHeight).fill("#000").stroke();

    doc.fillColor("white").font("Helvetica-Bold").fontSize(10);
    doc.text("Total H.T:", startX + 5, y + 7, { width: totalColumnWidths.label });
    doc.text(`${quotation.totalAmount.toFixed(2)} DH`, startX + totalColumnWidths.label, y + 7, { width: totalColumnWidths.value, align: "right" });

    doc.fillColor("black");

    y += rowHeight + 20; // Ajuster la position pour les signatures

    y += 30
    doc.moveDown(3);

    doc.text("Signature Client", 50, doc.page.height - 170).text("Signature Société", 400, doc.page.height - 170);
    doc.moveDown(3);
    doc.lineWidth(1).moveTo(50, doc.y).lineTo(200, doc.y).stroke();
    doc.moveTo(400, doc.y).lineTo(550, doc.y).stroke();

    // ✅ Pied de page
    doc.moveDown(1);

    // ✅ Pied de page (ajouté en bas de chaque page)
    doc.font("Helvetica").fontSize(8).fillColor("black");
    doc.text(
      "LUXY Marbre SARL - Tel: 0661336617 - 0603020343 - Route Driouch Bentaib",
      50,
      doc.page.height - 55,
      { align: "center", width: doc.page.width - 100 }
    );

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    await Quotation.findByIdAndDelete(id);
    res.status(200).json({ message: "Devis supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateInvoicePDF  = async (req, res) => {
  try {
    const { id } = req.params;
    const { avance } = req.body;
    const quotation = await Quotation.findById(id).populate("products.productId");

    if (!quotation) return res.status(404).json({ message: "Facture introuvable" });

    if (quotation.status !== "validé") {
      return res.status(400).json({ message: "Seuls les devis validés peuvent être transformés en facture" });
    }

    const totalAmount = quotation.totalAmount;
    const resteAPayer = totalAmount - avance;

    // Création du dossier "pdf" si inexistant
    const pdfDir = path.resolve("pdf");
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir);
    }

    // Définition du fichier PDF
    const doc = new PDFDocument({ size: "A4", margin: 20 });
    const filename = `Facture_${id}.pdf`;
    const filePath = path.join(pdfDir, filename);

    doc.pipe(fs.createWriteStream(filePath)); // Sauvegarde sur serveur
    doc.pipe(res); // Envoi au client

    // ✅ Logo
    const logoPath = path.join("assets", "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 420, 40, { width: 100 });
    }

    // ✅ Infos de l'entreprise
    doc.font("Helvetica-Bold").fontSize(13).text("Sté LUXY MARBRE SARL", 50, 40);
    doc.font("Helvetica").fontSize(8)
      .text("TEL: 0661336617", 50, 72)
      .text("TEL: 0603020343", 50, 84)
      .text("Route Driouch Bentaib", 50, 60);

    // ✅ Titre Centré
    doc.moveDown(5);
    doc.font("Helvetica-Bold").fontSize(14).text(`Facture: ${quotation.reference}`, { align: "center" });
    doc.moveDown(2);

    // ✅ Infos du Client
    const formattedDate = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    doc.font("Helvetica-Bold").fontSize(10).text("Client :", { underline: true }).moveDown(1);
    doc.font("Helvetica").fontSize(10)
      .text(`Nom: ${quotation.clientName}`)
      .text(`Téléphone: ${quotation.clientPhone}`)
      .text(`Date: ${formattedDate}`)
      .moveDown(1);

    // ✅ Tableau des Produits
    doc.font("Helvetica-Bold").fontSize(10).text("Produits :", { underline: true });
    doc.moveDown(0.5);

    const startX = 50;
    let y = doc.y;
    const columnWidths = { designation: 120, length: 50, width: 50, qty: 50, surface: 80, unitPrice: 70, total: 80 };

    // ✅ En-tête du tableau
    const rowHeight = 20;
    doc.rect(startX, y, columnWidths.designation, rowHeight).fill("#000").stroke("white");
    doc.rect(startX + columnWidths.designation, y, columnWidths.length, rowHeight).fill("#000").stroke("white");
    doc.rect(startX + columnWidths.designation + columnWidths.length, y, columnWidths.width, rowHeight).fill("#000").stroke("white");
    doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width, y, columnWidths.qty, rowHeight).fill("#000").stroke("white");
    doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty, y, columnWidths.surface, rowHeight).fill("#000").stroke("white");
    doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface, y, columnWidths.unitPrice, rowHeight).fill("#000").stroke("white");
    doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface + columnWidths.unitPrice, y, columnWidths.total, rowHeight).fill("#000").stroke("white");

    doc.fillColor("white").font("Helvetica-Bold").fontSize(10);
    doc.text("Désignation", startX + 5, y + 7, { width: columnWidths.designation });
    doc.text("Long", startX + columnWidths.designation + 5, y + 7, { width: columnWidths.length, align: "center" });
    doc.text("larg", startX + columnWidths.designation + columnWidths.length + 5, y + 7, { width: columnWidths.width, align: "center" });
    doc.text("Qté", startX + columnWidths.designation + columnWidths.length + columnWidths.width + 5, y + 7, { width: columnWidths.qty, align: "center" });
    doc.text("Surface", startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + 5, y + 7, { width: columnWidths.surface, align: "center" });
    doc.text("Prix U.", startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface + 5, y + 7, { width: columnWidths.unitPrice, align: "center" });
    doc.text("Total", startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface + columnWidths.unitPrice + 5, y + 7, { width: columnWidths.total, align: "center" });
    doc.fillColor("black");

    y += rowHeight;

    doc.font("Helvetica").fontSize(8);

    quotation.products.forEach((item) => {
      const productName = item.productId?.name || "Produit inconnu";
      const productDetails = `${productName}`;

      doc.rect(startX, y, columnWidths.designation, rowHeight).stroke("gray");
      doc.rect(startX + columnWidths.designation, y, columnWidths.length, rowHeight).stroke();
      doc.rect(startX + columnWidths.designation + columnWidths.length, y, columnWidths.width, rowHeight).stroke();
      doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width, y, columnWidths.qty, rowHeight).stroke();
      doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty, y, columnWidths.surface, rowHeight).stroke();
      doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface, y, columnWidths.unitPrice, rowHeight).stroke();
      doc.rect(startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface + columnWidths.unitPrice, y, columnWidths.total, rowHeight).stroke();

      // ✅ Vérifier si le texte est trop long, et réduire dynamiquement la taille
      let textSize = 10;
      if (doc.widthOfString(productDetails) > columnWidths.designation - 10) {
        textSize = 8; // Réduire la taille du texte si nécessaire
      }

      doc.fontSize(textSize);
      doc.text(productDetails, startX + 5, y + 7, { width: columnWidths.designation, ellipsis: true }); // Empêcher le retour à la ligne

      doc.fontSize(10);
      doc.text(`${item.length.toFixed(2)} m`, startX + columnWidths.designation + 5, y + 7, { width: columnWidths.length, align: "center" });
      doc.text(`${item.width.toFixed(2)} m`, startX + columnWidths.designation + columnWidths.length + 5, y + 7, { width: columnWidths.width, align: "center" });
      doc.text(item.quantity.toFixed(2), startX + columnWidths.designation + columnWidths.length + columnWidths.width + 5, y + 7, { width: columnWidths.qty, align: "center" });
      doc.text(`${item.surface.toFixed(2)} m²`, startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + 5, y + 7, { width: columnWidths.surface, align: "center" });
      doc.text(`${item.unitPrice.toFixed(2)} DH`, startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface + 5, y + 7, { width: columnWidths.unitPrice, align: "center" });
      doc.text(`${item.totalPrice.toFixed(2)} DH`, startX + columnWidths.designation + columnWidths.length + columnWidths.width + columnWidths.qty + columnWidths.surface + columnWidths.unitPrice + 5, y + 7, { width: columnWidths.total, align: "center" });

      y += rowHeight;
    });

    // ✅ Tableau Total H.T, Payé, Reste à payer
    y += 30; // Espacement après le tableau des produits
    doc.font("Helvetica-Bold").fontSize(10).text("Récapitulatif :", startX, y, { underline: true });
    y += 20;

    const totalColumnWidths = { label: 200, value: 100 };

    // ✅ En-tête du tableau
    doc.rect(startX, y, totalColumnWidths.label, rowHeight).fill("#000").stroke();
    doc.rect(startX + totalColumnWidths.label, y, totalColumnWidths.value + 20, rowHeight).fill("#000").stroke();

    doc.fillColor("white").font("Helvetica-Bold").fontSize(10);
    doc.text("Total H.T:", startX + 5, y + 7, { width: totalColumnWidths.label });
    doc.text(`${quotation.totalAmount.toFixed(2)} DH`, startX + totalColumnWidths.label, y + 7, { width: totalColumnWidths.value, align: "right" });

    doc.fillColor("black");

    // ✅ Ligne "Payé"
    y += rowHeight;
    doc.rect(startX, y, totalColumnWidths.label, rowHeight).stroke();
    doc.rect(startX + totalColumnWidths.label, y, totalColumnWidths.value + 20, rowHeight).stroke();

    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Mode de Règlement:", startX + 5, y + 7, { width: totalColumnWidths.label });
    doc.text(``, startX + totalColumnWidths.label, y + 7, { width: totalColumnWidths.value, align: "right" });

    // ✅ Ligne "Avance"
    y += rowHeight;
    doc.rect(startX, y, totalColumnWidths.label, rowHeight).stroke();
    doc.rect(startX + totalColumnWidths.label, y, totalColumnWidths.value + 20, rowHeight).stroke();

    doc.text("Avance:", startX + 5, y + 7, { width: totalColumnWidths.label });
    doc.text(`${avance.toFixed(2)} DH`, startX + totalColumnWidths.label, y + 7, { width: totalColumnWidths.value, align: "right" });

    // ✅ Ligne "Reste à Payer"
    y += rowHeight;
    doc.rect(startX, y, totalColumnWidths.label, rowHeight).stroke();
    doc.rect(startX + totalColumnWidths.label, y, totalColumnWidths.value + 20, rowHeight).stroke();

    doc.text("Reste à payer:", startX + 5, y + 7, { width: totalColumnWidths.label });
    doc.text(`${resteAPayer.toFixed(2)} DH`, startX + totalColumnWidths.label, y + 7, { width: totalColumnWidths.value, align: "right" });

    y += rowHeight + 20; // Ajuster la position pour les signatures

    y += 30
    doc.moveDown(3);

    doc.text("Signature Client", 50, doc.page.height - 170).text("Signature Société", 400, doc.page.height - 170);
    doc.moveDown(3);
    doc.lineWidth(1).moveTo(50, doc.y).lineTo(200, doc.y).stroke();
    doc.moveTo(400, doc.y).lineTo(550, doc.y).stroke();

    // ✅ Pied de page
    doc.moveDown(1);

    // ✅ Pied de page (ajouté en bas de chaque page)
    doc.font("Helvetica").fontSize(8).fillColor("black");
    doc.text(
      "LUXY Marbre SARL - Tel: 0661336617 - 0603020343 - Route Driouch Bentaib",
      50,
      doc.page.height - 55,
      { align: "center", width: doc.page.width - 100 }
    );

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
