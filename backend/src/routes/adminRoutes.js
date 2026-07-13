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

import {
  getSellers,
  getSellerById,
  blockSeller,
  unblockSeller,
  deleteSeller,
} from "../controllers/sellerController.js";

import {
  getDeliveryPartners,
  getDeliveryPartnerById,
  blockDeliveryPartner,
  unblockDeliveryPartner,
  deleteDeliveryPartner,
} from "../controllers/deliveryController.js";

import {
  getPendingSellerRequests,
  getPendingDeliveryRequests,
  approveSeller,
  rejectSeller,
  approveDeliveryPartner,
  rejectDeliveryPartner,
  getPendingDeliveryRequestById,
  getPendingSellerRequestById,
} from "../controllers/requestController.js";

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
// Seller Management (Admin)

router.get("/sellers", protect, adminMiddleware, getSellers);

router.get("/sellers/:id", protect, adminMiddleware, getSellerById);

router.put("/sellers/:id/block", protect, adminMiddleware, blockSeller);

router.put("/sellers/:id/unblock", protect, adminMiddleware, unblockSeller);

router.delete("/sellers/:id", protect, adminMiddleware, deleteSeller);

// ======================
// DELIVERY PARTNER MANAGEMENT
// ======================

router.get("/delivery-partners", protect, adminMiddleware, getDeliveryPartners);

router.get(
  "/delivery-partners/:id",
  protect,
  adminMiddleware,
  getDeliveryPartnerById,
);

router.put(
  "/delivery-partners/:id/block",
  protect,
  adminMiddleware,
  blockDeliveryPartner,
);

router.put(
  "/delivery-partners/:id/unblock",
  protect,
  adminMiddleware,
  unblockDeliveryPartner,
);

router.delete(
  "/delivery-partners/:id",
  protect,
  adminMiddleware,
  deleteDeliveryPartner,
);

// ======================
// REQUEST MANAGEMENT
// ======================

// Seller Requests
router.get(
  "/requests/sellers",
  protect,
  adminMiddleware,
  getPendingSellerRequests,
);

router.patch(
  "/requests/sellers/:id/approve",
  protect,
  adminMiddleware,
  approveSeller,
);

router.patch(
  "/requests/sellers/:id/reject",
  protect,
  adminMiddleware,
  rejectSeller,
);

// Delivery Partner Requests
router.get(
  "/requests/delivery-partners",
  protect,
  adminMiddleware,
  getPendingDeliveryRequests,
);

router.patch(
  "/requests/delivery-partners/:id/approve",
  protect,
  adminMiddleware,
  approveDeliveryPartner,
);

router.patch(
  "/requests/delivery-partners/:id/reject",
  protect,
  adminMiddleware,
  rejectDeliveryPartner,
);

router.get(
  "/requests/sellers/:id",
  protect,
  adminMiddleware,
  getPendingSellerRequestById,
);

router.get(
  "/requests/delivery-partners/:id",
  protect,
  adminMiddleware,
  getPendingDeliveryRequestById,
);

export default router;
