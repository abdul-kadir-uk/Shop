// routes/mobileCheckoutRoutes.js

import express from "express";

import { getMobileCheckoutSummary } from "../controllers/mobileCheckoutController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Get mobile checkout summary
router.post("/summary", protect, getMobileCheckoutSummary);

export default router;
