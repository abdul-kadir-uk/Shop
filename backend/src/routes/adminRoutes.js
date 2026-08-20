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

import {
  createCity,
  getAllCities,
  updateCity,
  updateCityStatus,
  deleteCity,
} from "../controllers/cityController.js";

import {
  createArea,
  getAreas,
  updateArea,
  deleteArea,
} from "../controllers/areaController.js";

import {
  assignDeliveryPartnerLocations,
  getDeliveryPartnerAssignments,
  updateDeliveryPartnerAssignments,
  removeDeliveryPartnerAssignment,
} from "../controllers/deliveryAssignmentController.js";

import {
  getAdminOrders,
  getAdminSingleOrder,
  updateAdminOrderStatus,
  getAdminCompletedOrders,
  getAdminCancelledOrders,
} from "../controllers/adminOrderController.js";

// ======================
// EARNING CONTROLLER
// ======================

import {
  markDeliveryDayEarningsAsPaid,
  updateDeliveryPartnerEarningRate,
  getAllDeliveryPartnerDailyEarnings,
} from "../controllers/earningController.js";

// ======================
// SELLER EARNING CONTROLLER
// ======================

import {
  getAdminSellerEarnings,
  updateSellerEarningPaymentStatus,
} from "../controllers/adminSellerEarningsController.js";

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

// ======================
// SELLER MANAGEMENT
// ======================

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
// DELIVERY PARTNER EARNINGS
// ======================

router.patch(
  "/delivery/earnings/:deliveryPartnerId/rate",
  protect,
  adminMiddleware,
  updateDeliveryPartnerEarningRate,
);

router.patch(
  "/delivery/earnings/:deliveryPartnerId/day-paid",
  protect,
  adminMiddleware,
  markDeliveryDayEarningsAsPaid,
);

router.get(
  "/delivery/earnings/daily",
  protect,
  adminMiddleware,
  getAllDeliveryPartnerDailyEarnings,
);

// ======================
// SELLER EARNINGS
// ======================

router.get(
  "/seller-earnings",
  protect,
  adminMiddleware,
  getAdminSellerEarnings,
);

router.patch(
  "/seller-earnings/:earningId/status",
  protect,
  adminMiddleware,
  updateSellerEarningPaymentStatus,
);

// ======================
// DELIVERY PARTNER LOCATION ASSIGNMENT
// ======================

router.post(
  "/delivery-partners/:deliveryPartnerId/assignments",
  protect,
  adminMiddleware,
  assignDeliveryPartnerLocations,
);

router.get(
  "/delivery-partners/:deliveryPartnerId/assignments",
  protect,
  adminMiddleware,
  getDeliveryPartnerAssignments,
);

router.put(
  "/delivery-partners/:deliveryPartnerId/assignments",
  protect,
  adminMiddleware,
  updateDeliveryPartnerAssignments,
);

router.delete(
  "/delivery-partners/:deliveryPartnerId/assignments",
  protect,
  adminMiddleware,
  removeDeliveryPartnerAssignment,
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

// ======================
// CITY MANAGEMENT
// ======================

// Create City
router.post("/cities", protect, adminMiddleware, createCity);

// Get All Cities
router.get("/cities", protect, adminMiddleware, getAllCities);

// Update City
router.put("/cities/:id", protect, adminMiddleware, updateCity);

// Update City Status
router.patch("/cities/:id/status", protect, adminMiddleware, updateCityStatus);

// Delete City
router.delete("/cities/:id", protect, adminMiddleware, deleteCity);

// ======================
// AREA MANAGEMENT
// ======================

// Create Area
router.post("/areas", protect, adminMiddleware, createArea);

// Get All Areas
router.get("/areas", protect, adminMiddleware, getAreas);

// Update Area
router.put("/areas/:areaId", protect, adminMiddleware, updateArea);

// Deactivate Area
router.delete("/areas/:areaId", protect, adminMiddleware, deleteArea);

// ======================
// ORDER MANAGEMENT
// ======================

// Active / available orders
router.get("/orders", protect, adminMiddleware, getAdminOrders);

// Completed orders
router.get(
  "/orders/completed",
  protect,
  adminMiddleware,
  getAdminCompletedOrders,
);

// Cancelled orders
router.get(
  "/orders/cancelled",
  protect,
  adminMiddleware,
  getAdminCancelledOrders,
);

// Single order
router.get("/orders/:orderId", protect, adminMiddleware, getAdminSingleOrder);

// Admin can update any order status
router.patch(
  "/orders/:orderId/status",
  protect,
  adminMiddleware,
  updateAdminOrderStatus,
);

export default router;
