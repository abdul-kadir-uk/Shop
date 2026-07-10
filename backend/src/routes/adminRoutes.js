// adminRoutes.js
import express from "express";

import {
  adminLogin,
  getAdminProfile,
  adminLogout,
} from "../controllers/adminController.js";

import {
  getCustomers,
  getCustomerById,
  blockCustomer,
  unblockCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

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

// ======================
// CUSTOMER MANAGEMENT
// ======================

router.get("/customers", protect, adminMiddleware, getCustomers);
router.get("/customer/:id", protect, adminMiddleware, getCustomerById);
router.patch("/customer/:id/block", protect, adminMiddleware, blockCustomer);
router.patch(
  "/customer/:id/unblock",
  protect,
  adminMiddleware,
  unblockCustomer,
);
router.delete("/customer/:id", protect, adminMiddleware, deleteCustomer);

export default router;
