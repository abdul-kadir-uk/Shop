// routes/mobileCartRoutes.js

import express from "express";

import {
  addToMobileCart,
  getMobileCart,
  updateMobileCartQuantity,
  removeMobileCartItem,
  clearMobileCart,
  getMobileCartCount,
} from "../controllers/mobileCartController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Add mobile product to cart
router.post("/", protect, addToMobileCart);

// Get mobile cart
router.get("/", protect, getMobileCart);

// Update mobile cart quantity
router.put("/", protect, updateMobileCartQuantity);

// Remove mobile product
router.delete("/remove/:productId", protect, removeMobileCartItem);

// Clear mobile cart
router.delete("/clear", protect, clearMobileCart);

// Get mobile cart count
router.get("/count", protect, getMobileCartCount);

export default router;
