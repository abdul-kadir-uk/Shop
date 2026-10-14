// routes/medicineCartRoutes.js

import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  addMedicineToCart,
  getMedicineCart,
  updateMedicineCartQuantity,
  removeMedicineCartItem,
  clearMedicineCart,
  getMedicineCartCount,
} from "../controllers/medicineCartController.js";

const router = express.Router();

/* ======================================================
   Medicine Cart Routes
====================================================== */

router.post("/add", protect, addMedicineToCart);

router.get("/", protect, getMedicineCart);

router.patch("/update", protect, updateMedicineCartQuantity);

router.delete("/remove/:productId", protect, removeMedicineCartItem);

router.delete("/clear", protect, clearMedicineCart);

router.get("/count", protect, getMedicineCartCount);

export default router;
