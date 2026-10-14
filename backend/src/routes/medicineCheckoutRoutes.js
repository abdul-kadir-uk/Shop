// src/routes/medicineCheckoutRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";

import { placeMedicineOrder } from "../controllers/medicineOrderController.js";

const router = express.Router();

// Place a Medicine order (Buy Now or Cart checkout)
router.post("/", protect, placeMedicineOrder);

export default router;
