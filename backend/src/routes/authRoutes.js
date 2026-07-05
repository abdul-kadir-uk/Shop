import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  customerSignup,
  sellerSignup,
  deliverySignup,
  login,
  verifySecurity,
  verifyCurrentPassword,
  resetPassword,
  logout,
} from "../controllers/authController.js";

const router = express.Router();

// Customer
router.post("/customer/signup", customerSignup);

// Seller
router.post("/seller/signup", sellerSignup);

// Delivery Partner
router.post("/delivery/signup", deliverySignup);

// Login
router.post("/login", login);

//verify security
router.post("/verify-security", verifySecurity);

// verify current password
router.post("/verify-current-password", protect, verifyCurrentPassword);

// Reset Password
router.post("/reset-password", resetPassword);

// Logout
router.post("/logout", protect, logout);
export default router;
