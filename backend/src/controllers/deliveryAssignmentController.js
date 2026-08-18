import mongoose from "mongoose";
import DeliveryPartner from "../models/DeliveryPartner.js";
import City from "../models/City.js";

// ======================================================
// Assign Cities to Delivery Partner
// POST /api/admin/delivery-partners/:deliveryPartnerId/assignments
// ======================================================

export const assignDeliveryPartnerLocations = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;
    const { cityIds = [] } = req.body;

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
    // Validate cityIds
    // --------------------------------------------------

    if (!Array.isArray(cityIds)) {
      return res.status(400).json({
        success: false,
        message: "cityIds must be an array",
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
    // Remove duplicate city IDs
    // --------------------------------------------------

    const uniqueCityIds = [...new Set(cityIds.map((id) => id.toString()))];

    // --------------------------------------------------
    // Validate city IDs
    // --------------------------------------------------

    for (const cityId of uniqueCityIds) {
      if (!mongoose.Types.ObjectId.isValid(cityId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid city ID: ${cityId}`,
        });
      }
    }

    // --------------------------------------------------
    // Make sure cities exist and are active
    // --------------------------------------------------

    const cities = await City.find({
      _id: { $in: uniqueCityIds },
      isActive: true,
    });

    if (cities.length !== uniqueCityIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more cities are invalid or inactive",
      });
    }

    // --------------------------------------------------
    // Add cities
    // $addToSet prevents duplicates
    // --------------------------------------------------

    await DeliveryPartner.findByIdAndUpdate(
      deliveryPartnerId,
      {
        $addToSet: {
          assignedCities: {
            $each: uniqueCityIds,
          },
        },
      },
      {
        new: true,
      },
    );

    // --------------------------------------------------
    // Get updated partner
    // --------------------------------------------------

    const updatedPartner = await DeliveryPartner.findById(
      deliveryPartnerId,
    ).populate("assignedCities", "name state deliveryCharge isActive");

    return res.status(200).json({
      success: true,
      message: "Cities assigned to delivery partner successfully",
      deliveryPartner: updatedPartner,
    });
  } catch (error) {
    console.error("Assign Delivery Partner Cities Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign cities",
      error: error.message,
    });
  }
};

// ======================================================
// Get Delivery Partner Assigned Cities
// GET /api/admin/delivery-partners/:deliveryPartnerId/assignments
// ======================================================

export const getDeliveryPartnerAssignments = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(deliveryPartnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery partner ID",
      });
    }

    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId)
      .select("name mobile approvalStatus assignedCities")
      .populate("assignedCities", "name state deliveryCharge isActive");

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    return res.status(200).json({
      success: true,
      deliveryPartner,
    });
  } catch (error) {
    console.error("Get Delivery Partner Assignments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get delivery partner assignments",
      error: error.message,
    });
  }
};

// ======================================================
// Replace Delivery Partner Cities
// PUT /api/admin/delivery-partners/:deliveryPartnerId/assignments
// ======================================================

export const updateDeliveryPartnerAssignments = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;
    const { cityIds = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(deliveryPartnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery partner ID",
      });
    }

    if (!Array.isArray(cityIds)) {
      return res.status(400).json({
        success: false,
        message: "cityIds must be an array",
      });
    }

    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId);

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    const uniqueCityIds = [...new Set(cityIds.map((id) => id.toString()))];

    for (const cityId of uniqueCityIds) {
      if (!mongoose.Types.ObjectId.isValid(cityId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid city ID: ${cityId}`,
        });
      }
    }

    const cities = await City.find({
      _id: { $in: uniqueCityIds },
      isActive: true,
    });

    if (cities.length !== uniqueCityIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more cities are invalid or inactive",
      });
    }

    // Replace all existing cities
    deliveryPartner.assignedCities = uniqueCityIds;

    await deliveryPartner.save();

    const updatedPartner = await DeliveryPartner.findById(
      deliveryPartnerId,
    ).populate("assignedCities", "name state deliveryCharge isActive");

    return res.status(200).json({
      success: true,
      message: "Delivery partner cities updated successfully",
      deliveryPartner: updatedPartner,
    });
  } catch (error) {
    console.error("Update Delivery Partner Cities Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update delivery partner cities",
      error: error.message,
    });
  }
};

// ======================================================
// Remove Cities from Delivery Partner
// DELETE /api/admin/delivery-partners/:deliveryPartnerId/assignments
// ======================================================

export const removeDeliveryPartnerAssignment = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;
    const { cityIds = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(deliveryPartnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery partner ID",
      });
    }

    if (!Array.isArray(cityIds)) {
      return res.status(400).json({
        success: false,
        message: "cityIds must be an array",
      });
    }

    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId);

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    const cityIdSet = new Set(cityIds.map((id) => id.toString()));

    deliveryPartner.assignedCities = deliveryPartner.assignedCities.filter(
      (cityId) => !cityIdSet.has(cityId.toString()),
    );

    await deliveryPartner.save();

    const updatedPartner = await DeliveryPartner.findById(
      deliveryPartnerId,
    ).populate("assignedCities", "name state deliveryCharge isActive");

    return res.status(200).json({
      success: true,
      message: "Cities removed from delivery partner successfully",
      deliveryPartner: updatedPartner,
    });
  } catch (error) {
    console.error("Remove Delivery Partner Cities Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove cities",
      error: error.message,
    });
  }
};
