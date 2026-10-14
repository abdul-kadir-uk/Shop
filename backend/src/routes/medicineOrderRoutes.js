// src/routes/medicineOrderRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  placeMedicineOrder,
  cancelMedicineOrder,
  getMyMedicineOrders,
  getSingleMedicineOrder,
} from "../controllers/medicineOrderController.js";

const router = express.Router();

router.post("/", protect, placeMedicineOrder);
router.get("/my-orders", protect, getMyMedicineOrders);
router.get("/:orderId", protect, getSingleMedicineOrder);
router.patch("/:orderId/cancel", protect, cancelMedicineOrder);

export default router;
