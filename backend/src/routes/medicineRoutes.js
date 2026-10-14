// src/routes/medicineRoutes.js

import express from "express";

import {
  getAllMedicines,
  getSingleMedicine,
  calculateMedicineProductPrice,
} from "../controllers/medicineController.js";

const router = express.Router();

// ======================================================
// Get All Medicine Products
// GET /api/medicines
// ======================================================

router.get("/", getAllMedicines);

// ======================================================
// Calculate Medicine Product Price
// POST /api/medicines/:slug/price
// ======================================================

router.post("/:slug/price", calculateMedicineProductPrice);

// ======================================================
// Get Single Medicine Product
// GET /api/medicines/:slug
// ======================================================

router.get("/:slug", getSingleMedicine);

export default router;
