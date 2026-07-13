import Seller from "../models/Seller.js";
import DeliveryPartner from "../models/DeliveryPartner.js";

// ==============================
// Get Pending Seller Requests
// ==============================
export const getPendingSellerRequests = async (req, res) => {
  try {
    const sellers = await Seller.find({
      approvalStatus: "pending",
    })
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sellers.length,
      sellers,
    });
  } catch (error) {
    console.error("Get Seller Requests Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch seller requests.",
    });
  }
};

// ==============================
// Get Pending Delivery Requests
// ==============================
export const getPendingDeliveryRequests = async (req, res) => {
  try {
    const deliveryPartners = await DeliveryPartner.find({
      approvalStatus: "pending",
    })
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveryPartners.length,
      deliveryPartners,
    });
  } catch (error) {
    console.error("Get Delivery Requests Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery requests.",
    });
  }
};

// ==============================
// Approve Seller
// ==============================
export const approveSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await Seller.findById(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    seller.approvalStatus = "approved";

    await seller.save();

    res.status(200).json({
      success: true,
      message: "Seller approved successfully.",
      seller,
    });
  } catch (error) {
    console.error("Approve Seller Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to approve seller.",
    });
  }
};

// ==============================
// Reject Seller
// ==============================
export const rejectSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await Seller.findById(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    seller.approvalStatus = "rejected";

    await seller.save();

    res.status(200).json({
      success: true,
      message: "Seller rejected successfully.",
      seller,
    });
  } catch (error) {
    console.error("Reject Seller Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reject seller.",
    });
  }
};

// ==============================
// Approve Delivery Partner
// ==============================
export const approveDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryPartner = await DeliveryPartner.findById(id);

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    deliveryPartner.approvalStatus = "approved";

    await deliveryPartner.save();

    res.status(200).json({
      success: true,
      message: "Delivery partner approved successfully.",
      deliveryPartner,
    });
  } catch (error) {
    console.error("Approve Delivery Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to approve delivery partner.",
    });
  }
};

// ==============================
// Reject Delivery Partner
// ==============================
export const rejectDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryPartner = await DeliveryPartner.findById(id);

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    deliveryPartner.approvalStatus = "rejected";

    await deliveryPartner.save();

    res.status(200).json({
      success: true,
      message: "Delivery partner rejected successfully.",
      deliveryPartner,
    });
  } catch (error) {
    console.error("Reject Delivery Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reject delivery partner.",
    });
  }
};

// ==============================
// Get Pending Seller Request By ID
// ==============================
export const getPendingSellerRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await Seller.findOne({
      _id: id,
      approvalStatus: "pending",
    }).populate("userId", "email");

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Pending seller request not found.",
      });
    }

    res.status(200).json({
      success: true,
      seller: {
        ...seller.toObject(),
        email: seller.userId?.email,
        joined: seller.createdAt,
      },
    });
  } catch (error) {
    console.error("Get Pending Seller Request Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch seller request.",
    });
  }
};

// ==============================
// Get Pending Delivery Request By ID
// ==============================
export const getPendingDeliveryRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryPartner = await DeliveryPartner.findOne({
      _id: id,
      approvalStatus: "pending",
    }).populate("userId", "email");

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Pending delivery partner request not found.",
      });
    }

    res.status(200).json({
      success: true,
      deliveryPartner: {
        ...deliveryPartner.toObject(),
        email: deliveryPartner.userId?.email,
        joined: deliveryPartner.createdAt,
      },
    });
  } catch (error) {
    console.error("Get Pending Delivery Request Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery partner request.",
    });
  }
};
