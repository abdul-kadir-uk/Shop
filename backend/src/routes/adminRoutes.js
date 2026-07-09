// adminRoutes.js
import express from "express";

import {
  adminLogin,
  getAdminProfile,
  adminLogout,
} from "../controllers/adminController.js";

import adminMiddleware from "../middleware/adminMiddleware.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================
// PUBLIC ROUTES
// ======================

// Admin Login
router.post("/login", adminLogin);

// ======================
// PROTECTED ROUTES
// ======================

// Get Logged In Admin
router.get("/profile", protect, adminMiddleware, getAdminProfile);

// Admin Logout
router.post("/logout", protect, adminMiddleware, adminLogout);

export default router;
