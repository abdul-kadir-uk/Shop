// routes / authRoutes.js;
import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  customerSignup,
  verifyCustomerSignupOtp,
  sellerSignup,
  verifySellerSignupOtp,
  deliverySignup,
  verifyDeliverySignupOtp,
  login,
  verifySecurity,
  verifyCurrentPassword,
  resetPassword,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
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

router.post("/seller/signup/verify-otp", verifySellerSignupOtp);

// Delivery Partner
router.post("/delivery/signup", uploadAadhaarDocument, deliverySignup);

router.post("/delivery/signup/verify-otp", verifyDeliverySignupOtp);

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

// Password reset through mobile OTP

router.post("/password-reset/send-otp", sendPasswordResetOtp);

router.post("/password-reset/verify-otp", verifyPasswordResetOtp);

// verify current password
router.post("/verify-current-password", protect, verifyCurrentPassword);

// Reset Password
router.post("/reset-password", resetPassword);

// Logout
router.post("/logout", protect, logout);
export default router;
