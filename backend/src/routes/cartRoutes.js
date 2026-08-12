// routes/cartRoutes.js
import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  addToCart,
  getCart,
  updateCartQuantity,
  removeCartItem,
  clearCart,
  getCartCount,
} from "../controllers/cartController.js";

const router = express.Router();

/* ======================================================
   Cart Routes
====================================================== */

router.post("/add", protect, addToCart);

router.get("/", protect, getCart);

router.patch("/update", protect, updateCartQuantity);

router.delete("/remove/:productId", protect, removeCartItem);

router.delete("/clear", protect, clearCart);

router.get("/count", protect, getCartCount);

export default router;
