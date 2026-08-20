// sellerRoutes.js
import express from "express";

import protect from "../middleware/authMiddleware.js";
import { requireApprovedSeller } from "../middleware/sellerMiddleware.js";

import {
  getSellerDashboard,
  getSellerProfile,
} from "../controllers/sellerController.js";

import {
  getSellerOrders,
  getSellerSingleOrder,
  updateSellerOrderStatus,
} from "../controllers/sellerOrderController.js";

import { getSellerEarnings } from "../controllers/sellerEarningsController.js";

const router = express.Router();

// ================= Dashboard =================
router.get("/dashboard", protect, requireApprovedSeller, getSellerDashboard);

// ================= Profile =================
router.get("/profile", protect, getSellerProfile);

// get orders
router.get("/orders", protect, requireApprovedSeller, getSellerOrders);

// ================= Earnings =================

router.get("/earnings", protect, requireApprovedSeller, getSellerEarnings);

// get single order
router.get(
  "/orders/:orderId",
  protect,
  requireApprovedSeller,
  getSellerSingleOrder,
);

// update  order status
router.patch(
  "/orders/:orderId/status",
  protect,
  requireApprovedSeller,
  updateSellerOrderStatus,
);

export default router;
