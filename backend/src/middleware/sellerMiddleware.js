// src/middleware/sellerMiddleware.js

import Seller from "../models/Seller.js";

// Ensure user is a seller and approved
export const requireApprovedSeller = async (req, res, next) => {
  try {
    // User must be logged in (protect middleware runs first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // User must be a seller
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Seller account required.",
      });
    }

    // Find seller profile
    const seller = await Seller.findOne({ userId: req.user._id });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    // Pending approval
    if (seller.approvalStatus === "pending") {
      return res.status(403).json({
        success: false,
        message: "Your seller account is under review.",
        redirect: "/signup/seller/under-review",
      });
    }

    // Rejected
    if (seller.approvalStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Your seller application has been rejected.",
        redirect: "/signup/seller/rejected",
      });
    }

    // Attach seller profile for controller use
    req.seller = seller;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
