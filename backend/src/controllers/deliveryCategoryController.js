// controllers/deliveryCategoryController.js

import mongoose from "mongoose";
import DeliveryPartner from "../models/DeliveryPartner.js";

// ======================================================
// Supported Delivery Categories
// ======================================================

const DELIVERY_CATEGORIES = ["groceries", "mobiles"];

// ======================================================
// Get Delivery Partner Categories
//
// GET
// /api/admin/delivery-partners/:deliveryPartnerId/categories
// ======================================================

export const getDeliveryPartnerCategories = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;

    // --------------------------------------------------
    // Validate delivery partner ID
    // --------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(deliveryPartnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery partner ID",
      });
    }

    // --------------------------------------------------
    // Find delivery partner
    // --------------------------------------------------

    const deliveryPartner = await DeliveryPartner.findById(
      deliveryPartnerId,
    ).select("name mobile approvalStatus assignedCategories");

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      deliveryPartner: {
        _id: deliveryPartner._id,
        name: deliveryPartner.name,
        mobile: deliveryPartner.mobile,
        approvalStatus: deliveryPartner.approvalStatus,
        assignedCategories: deliveryPartner.assignedCategories || [],
      },

      availableCategories: DELIVERY_CATEGORIES,
    });
  } catch (error) {
    console.error("Get Delivery Partner Categories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get delivery partner categories",
      error: error.message,
    });
  }
};

// ======================================================
// Replace Delivery Partner Categories
//
// PUT
// /api/admin/delivery-partners/:deliveryPartnerId/categories
// ======================================================

export const updateDeliveryPartnerCategories = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;
    const { categories = [] } = req.body;

    // --------------------------------------------------
    // Validate delivery partner ID
    // --------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(deliveryPartnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery partner ID",
      });
    }

    // --------------------------------------------------
    // Validate categories
    // --------------------------------------------------

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: "categories must be an array",
      });
    }

    // --------------------------------------------------
    // Normalize categories
    // --------------------------------------------------

    const normalizedCategories = categories.map((category) =>
      String(category).trim().toLowerCase(),
    );

    // --------------------------------------------------
    // Remove duplicates
    // --------------------------------------------------

    const uniqueCategories = [...new Set(normalizedCategories)];

    // --------------------------------------------------
    // Validate category names
    // --------------------------------------------------

    const invalidCategories = uniqueCategories.filter(
      (category) => !DELIVERY_CATEGORIES.includes(category),
    );

    if (invalidCategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more categories are invalid",
        invalidCategories,
        availableCategories: DELIVERY_CATEGORIES,
      });
    }

    // --------------------------------------------------
    // Find delivery partner
    // --------------------------------------------------

    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId);

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    // --------------------------------------------------
    // Replace existing categories
    // --------------------------------------------------
    //
    // Example:
    //
    // Old:
    // ["grocery", "mobiles"]
    //
    // Admin selects:
    // ["grocery"]
    //
    // Result:
    // ["grocery"]
    //
    // Empty array is also allowed.
    // --------------------------------------------------

    deliveryPartner.assignedCategories = uniqueCategories;

    await deliveryPartner.save();

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Delivery partner categories updated successfully",

      deliveryPartner: {
        _id: deliveryPartner._id,
        name: deliveryPartner.name,
        mobile: deliveryPartner.mobile,
        approvalStatus: deliveryPartner.approvalStatus,
        assignedCategories: deliveryPartner.assignedCategories,
      },
    });
  } catch (error) {
    console.error("Update Delivery Partner Categories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update delivery partner categories",
      error: error.message,
    });
  }
};
