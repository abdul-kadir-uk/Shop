// routes/mobileOrderRoutes.js

import express from "express";

import {
  createMobileOrder,
  getMyMobileOrders,
  getSingleMobileOrder,
  cancelMobileOrder,
} from "../controllers/mobileOrderController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Create mobile order
router.post("/", protect, createMobileOrder);

// Get customer's mobile orders
router.get("/", protect, getMyMobileOrders);

// Get single mobile order
router.get("/:id", protect, getSingleMobileOrder);

// Cancel mobile order
router.patch("/:id/cancel", protect, cancelMobileOrder);

export default router;
