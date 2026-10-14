// src/routes/medicineSellerOrderRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  getSellerMedicineOrders,
  getSellerSingleMedicineOrder,
  updateSellerMedicineOrderStatus,
} from "../controllers/medicineSellerOrderController.js";

const router = express.Router();

router.get("/", protect, getSellerMedicineOrders);
router.get("/:orderId", protect, getSellerSingleMedicineOrder);
router.patch("/:orderId/status", protect, updateSellerMedicineOrderStatus);

export default router;
