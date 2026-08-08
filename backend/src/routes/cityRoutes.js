import express from "express";
import { getActiveCities } from "../controllers/cityController.js";

const router = express.Router();

// Public Cities
router.get("/", getActiveCities);

export default router;
