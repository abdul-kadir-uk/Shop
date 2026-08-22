// controllers/deliveryController.js

import DeliveryPartner from "../models/DeliveryPartner.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import City from "../models/City.js";

import { ORDER_STATUS, PAYMENT_STATUS } from "../constants/orderStatus.js";

// ======================================================
// Get Delivery Dashboard
// ======================================================

export const getDeliveryDashboard = async (req, res) => {
  try {
    // --------------------------------------------------
    // Make sure logged-in user is a delivery partner
    // --------------------------------------------------

    if (req.user.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Only delivery partners can access dashboard.",
      });
    }

    // --------------------------------------------------
    // Find delivery partner
    // --------------------------------------------------

    const deliveryPartner = await DeliveryPartner.findOne({
      userId: req.user._id,
    }).lean();

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    const deliveryPartnerId = deliveryPartner._id;

    // ==================================================
    // DASHBOARD COUNTS
    // ==================================================

    const [availableDeliveries, pendingDeliveries, completedDeliveries] =
      await Promise.all([
        // =================================================
        // AVAILABLE DELIVERIES
        // =================================================
        //
        // The order is available if at least one item:
        //
        // - has no delivery partner
        //
        // Seller confirmation is NOT required.
        //
        // Therefore:
        //
        // item.orderStatus = ordered
        // deliveryPartner = null
        //
        // is still available.
        // =================================================

        Order.countDocuments({
          orderStatus: {
            $in: [ORDER_STATUS.ORDERED, ORDER_STATUS.CONFIRMED],
          },

          items: {
            $elemMatch: {
              deliveryPartner: null,
            },
          },
        }),

        // =================================================
        // PENDING DELIVERIES
        // =================================================
        //
        // The delivery partner has accepted the order when
        // at least one item belongs to this partner.
        //
        // IMPORTANT:
        // We do NOT check item.orderStatus here.
        //
        // An accepted item can still be:
        //
        // item.orderStatus = ordered
        //
        // because seller confirmation is independent.
        // =================================================

        Order.countDocuments({
          orderStatus: {
            $in: [
              ORDER_STATUS.ORDERED,
              ORDER_STATUS.CONFIRMED,
              ORDER_STATUS.OUT_FOR_DELIVERY,
            ],
          },

          items: {
            $elemMatch: {
              deliveryPartner: deliveryPartnerId,
            },
          },
        }),

        // =================================================
        // COMPLETED DELIVERIES
        // =================================================
        //
        // Completion is controlled by the WHOLE ORDER status.
        //
        // The delivery partner must also own at least one item.
        // =================================================

        Order.countDocuments({
          orderStatus: {
            $in: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
          },

          items: {
            $elemMatch: {
              deliveryPartner: deliveryPartnerId,
            },
          },
        }),
      ]);

    // ==================================================
    // RECENT PENDING DELIVERIES
    // ==================================================

    const recentOrders = await Order.find({
      // Parent order is still active
      orderStatus: {
        $in: [
          ORDER_STATUS.ORDERED,
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.OUT_FOR_DELIVERY,
        ],
      },

      // This delivery partner accepted the order
      items: {
        $elemMatch: {
          deliveryPartner: deliveryPartnerId,
        },
      },
    })
      .populate("customer", "name email mobile")
      .populate("items.seller", "shopName address")
      .populate("items.product", "productName slug")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // ==================================================
    // Only return this delivery partner's items
    // ==================================================

    const recentDeliveries = recentOrders
      .map((order) => {
        const myItems = order.items.filter(
          (item) =>
            item.deliveryPartner &&
            item.deliveryPartner.toString() === deliveryPartnerId.toString(),
        );

        if (myItems.length === 0) {
          return null;
        }

        return {
          _id: order._id,

          orderNumber: order.orderNumber,

          orderStatus: order.orderStatus,

          customer: order.customer,

          shippingAddress: order.shippingAddress,

          deliveryContact: order.deliveryContact,

          items: myItems,

          pricing: order.pricing,

          paymentMethod: order.paymentMethod,

          paymentStatus: order.paymentStatus,

          createdAt: order.createdAt,
        };
      })
      .filter(Boolean);

    // ==================================================
    // TOTAL ASSIGNED
    // ==================================================

    const totalAssigned = pendingDeliveries + completedDeliveries;

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      dashboard: {
        availableDeliveries,
        pendingDeliveries,
        completedDeliveries,
        totalAssigned,
      },

      recentDeliveries,
    });
  } catch (error) {
    console.error("Get Delivery Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivery dashboard.",
    });
  }
};

// Get delivery partner Profile
export const getDeliveryProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").lean();

    const deliveryPartner = await DeliveryPartner.findOne({
      userId: req.user._id,
    }).lean();

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner profile not found",
      });
    }

    // Get all cities assigned to this delivery partner
    const cities = await City.find({
      _id: { $in: deliveryPartner.assignedCities || [] },
    })
      .select("name")
      .lean();

    res.status(200).json({
      success: true,
      user,
      deliveryPartner,
      cities,
    });
  } catch (error) {
    console.error("Get delivery profile error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update delivery partner Profile
export const updateDeliveryProfile = async (req, res) => {
  try {
    const { name, mobile, address } = req.body;

    const user = await User.findById(req.user._id);

    const deliveryPartner = await DeliveryPartner.findOne({
      userId: req.user._id,
    });

    if (!user || !deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "delivery partner not found",
      });
    }

    user.name = name || user.name;
    user.mobile = mobile || user.mobile;
    user.address = address || user.address;

    deliveryPartner.shopName = shopName || deliveryPartner.shopName;
    deliveryPartner.category = category || deliveryPartner.category;

    await user.save();
    await deliveryPartner.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
      deliveryPartner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
    const deliveryPartner = await DeliveryPartner.findById(id);

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
        earningPerDelivery: deliveryPartner.earningPerDelivery,
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
