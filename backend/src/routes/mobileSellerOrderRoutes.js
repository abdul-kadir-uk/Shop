// routes/mobileSellerOrderRoutes.js

import express from "express";

import protect from "../middleware/authMiddleware.js";
import { requireApprovedSeller } from "../middleware/sellerMiddleware.js";

import {
  getMobileSellerOrders,
  getMobileSellerSingleOrder,
  updateMobileSellerOrderStatus,
} from "../controllers/mobileSellerOrderController.js";

const router = express.Router();

// ======================================================
// MOBILE SELLER ORDERS
// ======================================================

router.get("/", protect, requireApprovedSeller, getMobileSellerOrders);

router.get(
  "/:orderId",
  protect,
  requireApprovedSeller,
  getMobileSellerSingleOrder,
);

router.patch(
  "/:orderId/status",
  protect,
  requireApprovedSeller,
  updateMobileSellerOrderStatus,
);

export default router;
