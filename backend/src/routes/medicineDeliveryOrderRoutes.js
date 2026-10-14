import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  getAvailableMedicineDeliveryOrders,
  acceptMedicineDeliveryOrder,
  getMyMedicineDeliveryOrders,
  updateMedicineDeliveryOrderStatus,
} from "../controllers/medicineDeliveryOrderController.js";

const router = express.Router();

router.get("/available", protect, getAvailableMedicineDeliveryOrders);

router.get("/my-orders", protect, getMyMedicineDeliveryOrders);

router.post("/:orderId/accept", protect, acceptMedicineDeliveryOrder);

router.patch("/:orderId/status", protect, updateMedicineDeliveryOrderStatus);

export default router;
