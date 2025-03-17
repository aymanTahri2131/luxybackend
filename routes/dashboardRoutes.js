import express from "express";
import { getDashboardStats, getQuotationsStats, getQuotationsByStatus, getLowStockProducts, getOutOfStockCount } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", getDashboardStats);
router.get("/quotations-stats", getQuotationsStats);
router.get("/quotations-status", getQuotationsByStatus);
router.get("/low-stock-products", getLowStockProducts);
router.get("/out-of-stock-count", getOutOfStockCount);

export default router;
