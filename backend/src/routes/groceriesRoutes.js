// routes/groceryRoutes.js
import express from "express";

import {
  getAllGroceries,
  getSingleGrocery,
  calculateGroceryProductPrice,
} from "../controllers/groceryController.js";

const router = express.Router();

// ======================================================
// Get All Grocery Products
// GET /api/groceries
// ======================================================

router.get("/", getAllGroceries);

// ======================================================
// Calculate Product Price
// POST /api/groceries/:slug/price
// ======================================================

router.post("/:slug/price", calculateGroceryProductPrice);

// ======================================================
// Get Single Grocery Product
// GET /api/groceries/:slug
// ======================================================

router.get("/:slug", getSingleGrocery);

export default router;
