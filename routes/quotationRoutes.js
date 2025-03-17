import express from "express";
import { getQuotations, createQuotation, generateQuotationPDF, deleteQuotation, searchQuotations, updateQuotationStatus, generateInvoicePDF } from "../controllers/quotationController.js";

const router = express.Router();

router.get("/", getQuotations);
router.post("/", createQuotation);
router.get("/:id/pdf", generateQuotationPDF);
router.delete("/:id", deleteQuotation);
router.get("/search", searchQuotations);
router.put("/:id/status", updateQuotationStatus);
router.post("/:id/invoice", generateInvoicePDF);


export default router;
