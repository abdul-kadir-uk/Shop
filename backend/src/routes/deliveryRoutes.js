// routes/deliveryRoutes.js
import express from "express";

import protect from "../middleware/authMiddleware.js";
import { requireApprovedDelivery } from "../middleware/deliveryMiddleware.js";

import {
  getDeliveryProfile,
  getDeliveryDashboard,
} from "../controllers/deliveryController.js";

import {
  getAvailableDeliveryOrders,
  acceptDeliveryOrder,
  getMyDeliveryOrders,
  updateDeliveryOrderStatus,
} from "../controllers/deliveryOrderController.js";

const router = express.Router();

// ======================================================
// Dashboard
// ======================================================

router.get(
  "/dashboard",
  protect,
  requireApprovedDelivery,
  getDeliveryDashboard,
);

// ======================================================
// Profile
// ======================================================

router.get("/profile", protect, getDeliveryProfile);

// ======================================================
// Available Delivery Orders
// ======================================================
// Seller-confirmed items that have not been accepted
// by another delivery partner.
//
// GET /api/delivery/orders
// ======================================================

router.get(
  "/orders",
  protect,
  requireApprovedDelivery,
  getAvailableDeliveryOrders,
);

// ======================================================
// Accept Delivery Item
// ======================================================
// A delivery partner accepts one specific item.
//
// PATCH
// /api/delivery/orders/:orderId/items/:itemIndex/accept
// ======================================================

router.patch(
  "/orders/:orderId/items/:itemIndex/accept",
  protect,
  requireApprovedDelivery,
  acceptDeliveryOrder,
);

// ======================================================
// My Delivery Orders
// ======================================================
// Shows only items accepted by the logged-in
// delivery partner.
//
// GET /api/delivery/my-orders
// ======================================================

router.get("/my-orders", protect, requireApprovedDelivery, getMyDeliveryOrders);

// ======================================================
// Update Delivery Status
// ======================================================
// confirmed
//      ↓
// outForDelivery
//      ↓
// delivered / cancelled
//
// PATCH
// /api/delivery/orders/:orderId/items/:itemIndex/status
// ======================================================

router.patch(
  "/orders/:orderId/items/:itemIndex/status",
  protect,
  requireApprovedDelivery,
  updateDeliveryOrderStatus,
);

export default router;
