// routes/mobileRoutes.js

import express from "express";

import {
  getMobileProducts,
  getMobileProduct,
} from "../controllers/mobileController.js";

const router = express.Router();

// Public mobile product listing
router.get("/", getMobileProducts);

// Public single mobile product
router.get("/:slug", getMobileProduct);

export default router;
