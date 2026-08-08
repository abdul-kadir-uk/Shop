import express from "express";

import protect from "../middleware/authMiddleware.js";

import { getCheckoutSummary } from "../controllers/checkoutController.js";

const router = express.Router();

/* ==========================================================
   Checkout
========================================================== */

// Get Checkout Summary
router.post("/summary", protect, getCheckoutSummary);

export default router;
