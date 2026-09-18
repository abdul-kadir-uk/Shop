// src/routes/mobileProductRoutes.js

import express from "express";

import protect from "../middleware/authMiddleware.js";
import { requireApprovedSeller } from "../middleware/sellerMiddleware.js";

import {
  uploadProductImages,
  compressProductImages,
} from "../middleware/uploadMiddleware.js";

import {
  createMobileProduct,
  getSellerMobileProducts,
  getSellerMobileProduct,
  updateMobileProduct,
  deleteMobileProduct,
} from "../controllers/mobileProductController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Mobile Products
|--------------------------------------------------------------------------
*/

// ================= Get Seller Mobile Products =================
router.get(
  "/products",
  protect,
  requireApprovedSeller,
  getSellerMobileProducts,
);

// ================= Get Single Mobile Product =================
router.get(
  "/products/:id",
  protect,
  requireApprovedSeller,
  getSellerMobileProduct,
);

// ================= Update Mobile Product =================
router.put(
  "/products/:id",
  protect,
  requireApprovedSeller,
  uploadProductImages,
  compressProductImages,
  updateMobileProduct,
);

// ================= Add Mobile Product =================
router.post(
  "/products",
  protect,
  requireApprovedSeller,
  uploadProductImages,
  compressProductImages,
  createMobileProduct,
);

// ================= Delete Mobile Product =================
router.delete(
  "/products/:id",
  protect,
  requireApprovedSeller,
  deleteMobileProduct,
);

export default router;
