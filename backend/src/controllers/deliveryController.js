import DeliveryPartner from "../models/DeliveryPartner.js";
import User from "../models/User.js";

// ======================
// GET ALL APPROVED DELIVERY PARTNERS (ADMIN)
// ======================

export const getDeliveryPartners = async (req, res) => {
  try {
    const { search } = req.query;

    const deliveryPartners = await DeliveryPartner.find({
      approvalStatus: "approved",
    }).populate("userId", "name email mobile isBlocked createdAt");

    let data = deliveryPartners.map((delivery) => ({
      _id: delivery._id,
      name: delivery.userId.name,
      email: delivery.userId.email,
      mobile: delivery.userId.mobile,
      joined: delivery.userId.createdAt,
      isBlocked: delivery.userId.isBlocked,
      status: delivery.userId.isBlocked ? "Blocked" : "Active",
    }));

    if (search) {
      const keyword = search.toLowerCase();

      data = data.filter(
        (delivery) =>
          delivery.name.toLowerCase().includes(keyword) ||
          delivery.email.toLowerCase().includes(keyword) ||
          delivery.mobile.includes(keyword),
      );
    }

    data.sort((a, b) => new Date(b.joined) - new Date(a.joined));

    return res.status(200).json({
      success: true,
      count: data.length,
      deliveryPartners: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// GET DELIVERY PARTNER DETAILS (ADMIN)
// ======================

export const getDeliveryPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await DeliveryPartner.findById(id).populate(
      "userId",
      "name email mobile role isVerified isBlocked createdAt",
    );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    return res.status(200).json({
      success: true,
      deliveryPartner: {
        _id: delivery._id,
        userId: delivery.userId._id,
        name: delivery.userId.name,
        email: delivery.userId.email,
        mobile: delivery.userId.mobile,
        address: delivery.address,
        aadhaarNumber: delivery.aadhaarNumber,
        aadhaarDocument: delivery.aadhaarDocument,
        approvalStatus: delivery.approvalStatus,
        role: delivery.userId.role,
        isVerified: delivery.userId.isVerified,
        isBlocked: delivery.userId.isBlocked,
        joined: delivery.userId.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// BLOCK DELIVERY PARTNER (ADMIN)
// ======================

export const blockDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await DeliveryPartner.findById(id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    const user = await User.findById(delivery.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(400).json({
        success: false,
        message: "Delivery partner is already blocked",
      });
    }

    user.isBlocked = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Delivery partner blocked successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// UNBLOCK DELIVERY PARTNER (ADMIN)
// ======================

export const unblockDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await DeliveryPartner.findById(id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    const user = await User.findById(delivery.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isBlocked) {
      return res.status(400).json({
        success: false,
        message: "Delivery partner is already active",
      });
    }

    user.isBlocked = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Delivery partner unblocked successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// DELETE DELIVERY PARTNER (ADMIN)
// ======================

export const deleteDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await DeliveryPartner.findById(id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    await User.findByIdAndDelete(delivery.userId);

    await DeliveryPartner.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Delivery partner deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
