// src/routes/medicineProductRoutes.js

import express from "express";

import protect from "../middleware/authMiddleware.js";
import { requireApprovedSeller } from "../middleware/sellerMiddleware.js";

import {
  uploadProductImages,
  compressProductImages,
} from "../middleware/uploadMiddleware.js";

import {
  createMedicineProduct,
  getSellerMedicineProducts,
  getSellerMedicineProduct,
  updateMedicineProduct,
  deleteMedicineProduct,
} from "../controllers/medicineProductController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Medicine Products
|--------------------------------------------------------------------------
*/

// ================= Medicine Products =================
router.get(
  "/products",
  protect,
  requireApprovedSeller,
  getSellerMedicineProducts,
);

// ================= Get Single Medicine Product =================
router.get(
  "/products/:id",
  protect,
  requireApprovedSeller,
  getSellerMedicineProduct,
);

// ================= Update Medicine Product =================
router.put(
  "/products/:id",
  protect,
  requireApprovedSeller,
  uploadProductImages,
  compressProductImages,
  updateMedicineProduct,
);

// ================= Add Medicine Product =================
router.post(
  "/products",
  protect,
  requireApprovedSeller,
  uploadProductImages,
  compressProductImages,
  createMedicineProduct,
);

// ================= Delete Medicine Product =================
router.delete(
  "/products/:id",
  protect,
  requireApprovedSeller,
  deleteMedicineProduct,
);

export default router;
