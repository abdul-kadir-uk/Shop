// src/middleware/deliveryMiddleware.js

import DeliveryPartner from "../models/DeliveryPartner.js";

// Ensure user is a delivery partner and approved
export const requireApprovedDelivery = async (req, res, next) => {
  try {
    // User must be logged in (protect middleware runs first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // User must be a delivery partner
    if (req.user.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Delivery partner account required.",
      });
    }

    // Find delivery partner profile
    const deliveryPartner = await DeliveryPartner.findOne({
      userId: req.user._id,
    });

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner profile not found.",
      });
    }

    // Pending approval
    if (deliveryPartner.approvalStatus === "pending") {
      return res.status(403).json({
        success: false,
        message: "Your delivery partner account is under review.",
        redirect: "/signup/delivery/under-review",
      });
    }

    // Rejected
    if (deliveryPartner.approvalStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Your delivery partner application has been rejected.",
        redirect: "/signup/delivery/rejected",
      });
    }

    // Attach delivery profile for controller use
    req.deliveryPartner = deliveryPartner;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
