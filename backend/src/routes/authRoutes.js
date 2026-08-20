// routes / authRoutes.js;
import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  customerSignup,
  verifyCustomerSignupOtp,
  sellerSignup,
  deliverySignup,
  login,
  verifySecurity,
  verifyCurrentPassword,
  resetPassword,
  logout,
} from "../controllers/authController.js";

import { getCustomerProfile } from "../controllers/customerController.js";
import { getSellerProfile } from "../controllers/sellerController.js";
import { getDeliveryProfile } from "../controllers/deliveryController.js";
import { uploadAadhaarDocument } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Customer
router.post("/customer/signup", customerSignup);

router.post("/customer/signup/verify-otp", verifyCustomerSignupOtp);

// Seller
router.post("/seller/signup", sellerSignup);

// Delivery Partner
router.post("/delivery/signup", uploadAadhaarDocument, deliverySignup);
// Login
router.post("/login", login);

// customer profile
router.get("/customer/profile", protect, getCustomerProfile);

//seller profile
router.get("/seller/profile", protect, getSellerProfile);

// delivery partner profile
router.get("/delivery/profile", protect, getDeliveryProfile);

//verify security
router.post("/verify-security", verifySecurity);

// verify current password
router.post("/verify-current-password", protect, verifyCurrentPassword);

// Reset Password
router.post("/reset-password", resetPassword);

// Logout
router.post("/logout", protect, logout);
export default router;
