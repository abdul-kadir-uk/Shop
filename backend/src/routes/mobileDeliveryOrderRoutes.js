// routes/mobileDeliveryOrderRoutes.js

import express from "express";

import protect from "../middleware/authMiddleware.js";
import { requireApprovedDelivery } from "../middleware/deliveryMiddleware.js";

import {
  getAvailableMobileDeliveryOrders,
  acceptMobileDeliveryOrder,
  getMyMobileDeliveryOrders,
  updateMobileDeliveryOrderStatus,
} from "../controllers/mobileDeliveryOrderController.js";

const router = express.Router();

// ======================================================
// Available Mobile Delivery Orders
// ======================================================
//
// GET /api/delivery/mobile-orders
// ======================================================

router.get(
  "/",
  protect,
  requireApprovedDelivery,
  getAvailableMobileDeliveryOrders,
);

// ======================================================
// Accept Mobile Delivery Order
// ======================================================
//
// PATCH /api/delivery/mobile-orders/:orderId/accept
// ======================================================

router.patch(
  "/:orderId/accept",
  protect,
  requireApprovedDelivery,
  acceptMobileDeliveryOrder,
);

// ======================================================
// My Mobile Delivery Orders
// ======================================================
//
// GET /api/delivery/mobile-orders/my-orders
// ======================================================

router.get(
  "/my-orders",
  protect,
  requireApprovedDelivery,
  getMyMobileDeliveryOrders,
);

// ======================================================
// Update Mobile Delivery Status
// ======================================================
//
// PATCH /api/delivery/mobile-orders/:orderId/status
// ======================================================

router.patch(
  "/:orderId/status",
  protect,
  requireApprovedDelivery,
  updateMobileDeliveryOrderStatus,
);

export default router;
