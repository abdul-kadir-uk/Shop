// src/routes/groceryProductRoutes.js

import express from "express";

import protect from "../middleware/authMiddleware.js";
import { requireApprovedSeller } from "../middleware/sellerMiddleware.js";

import {
  uploadProductImages,
  compressProductImages,
} from "../middleware/uploadMiddleware.js";

import {
  createGroceryProduct,
  getSellerGroceryProducts,
  getSellerGroceryProduct,
  updateGroceryProduct,
  deleteGroceryProduct,
} from "../controllers/groceryProductController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Grocery Products
|--------------------------------------------------------------------------
*/

// ================= Grocery Products =================
router.get(
  "/products",
  protect,
  requireApprovedSeller,
  getSellerGroceryProducts,
);

// ================= Get Single Grocery Product =================
router.get(
  "/products/:id",
  protect,
  requireApprovedSeller,
  getSellerGroceryProduct,
);

// ================= Update Grocery Product =================
router.put(
  "/products/:id",
  protect,
  requireApprovedSeller,
  uploadProductImages,
  compressProductImages,
  updateGroceryProduct,
);

// ================= Add Grocery Product =================
router.post(
  "/products",
  protect,
  requireApprovedSeller,
  uploadProductImages,
  compressProductImages,
  createGroceryProduct,
);

// ================= Delete Grocery Product =================
router.delete(
  "/products/:id",
  protect,
  requireApprovedSeller,
  deleteGroceryProduct,
);

export default router;
