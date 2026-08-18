import express from "express";

import { getActiveCities } from "../controllers/cityController.js";

import { getActiveAreasByCity } from "../controllers/areaController.js";

const router = express.Router();

// ======================
// PUBLIC CITIES
// ======================

// GET /api/cities
router.get("/", getActiveCities);

// ======================
// PUBLIC AREAS
// ======================

// GET /api/cities/:cityId/areas
//
// Returns ONLY active areas belonging
// to the selected city.
router.get("/:cityId/areas", getActiveAreasByCity);

export default router;
