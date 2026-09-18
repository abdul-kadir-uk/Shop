// controllers/mobileSellerOrderController.js

import mongoose from "mongoose";
import MobileOrder from "../models/MobileOrder.js";
import Seller from "../models/Seller.js";

const SELLER_ALLOWED_STATUS = ["confirmed", "notAvailable"];

const COMPLETED_ITEM_STATUSES = [
  "confirmed",
  "notAvailable",
  "outForDelivery",
  "delivered",
  "cancelled",
];

// ======================================================
// GET SELLER MOBILE ORDERS
// ======================================================

export const getMobileSellerOrders = async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Seller access required.",
      });
    }

    const seller = await Seller.findOne({
      userId: req.user._id,
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    const status = req.query.status || "ordered";

    let itemStatusFilter;

    if (status === "ordered") {
      itemStatusFilter = {
        $in: ["ordered"],
      };
    } else if (status === "completed") {
      itemStatusFilter = {
        $in: COMPLETED_ITEM_STATUSES,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid order status filter.",
      });
    }

    const sellerId = new mongoose.Types.ObjectId(seller._id);

    const orderFilter = {
      items: {
        $elemMatch: {
          seller: sellerId,
          orderStatus: itemStatusFilter,
        },
      },
    };

    const totalOrders = await MobileOrder.countDocuments(orderFilter);

    const totalPages = Math.ceil(totalOrders / limit);

    const skip = (page - 1) * limit;

    const orders = await MobileOrder.find(orderFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const sellerOrders = orders.map((order) => {
      const sellerItems = order.items.filter(
        (item) =>
          String(item.seller) === String(seller._id) &&
          itemStatusFilter.$in.includes(item.orderStatus),
      );

      const sellerTotal = sellerItems.reduce(
        (total, item) => total + Number(item.subtotal || 0),
        0,
      );

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,

        sellerTotal,

        totalItems: sellerItems.reduce(
          (total, item) => total + Number(item.quantity || 0),
          0,
        ),

        items: sellerItems.map((item) => ({
          product: item.product,
          productName: item.productName,
          brand: item.brand || "",
          image: item.image || "",

          quantity: item.quantity,

          variant: item.variant || {
            variantGroupId: "",
            variantName: "",
            ram: "",
            storage: "",
          },

          color: item.color || "",
          colorPrice: item.colorPrice !== undefined ? item.colorPrice : null,

          // Historical order snapshots.
          price: Number(item.price || 0),
          discountPrice:
            item.discountPrice !== undefined ? item.discountPrice : null,

          subtotal: Number(item.subtotal || 0),

          orderStatus: item.orderStatus,
        })),
      };
    });

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalOrders,
      totalPages,
      orders: sellerOrders,
    });
  } catch (error) {
    console.error("Get Mobile Seller Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mobile seller orders.",
    });
  }
};

// ======================================================
// GET SINGLE MOBILE SELLER ORDER
// ======================================================

export const getMobileSellerSingleOrder = async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Seller access required.",
      });
    }

    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const seller = await Seller.findOne({
      userId: req.user._id,
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    const order = await MobileOrder.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Mobile order not found.",
      });
    }

    const sellerItems = order.items.filter(
      (item) => String(item.seller) === String(seller._id),
    );

    if (sellerItems.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this order.",
      });
    }

    const sellerTotal = sellerItems.reduce(
      (total, item) => total + Number(item.subtotal || 0),
      0,
    );

    return res.status(200).json({
      success: true,

      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,

        sellerTotal,

        totalItems: sellerItems.reduce(
          (total, item) => total + Number(item.quantity || 0),
          0,
        ),

        items: sellerItems.map((item) => ({
          product: item.product,
          productName: item.productName,
          brand: item.brand || "",
          image: item.image || "",

          quantity: item.quantity,

          variant: item.variant || {
            variantGroupId: "",
            variantName: "",
            ram: "",
            storage: "",
          },

          color: item.color || "",
          colorPrice: item.colorPrice !== undefined ? item.colorPrice : null,

          // Historical order snapshots.
          price: Number(item.price || 0),
          discountPrice:
            item.discountPrice !== undefined ? item.discountPrice : null,

          subtotal: Number(item.subtotal || 0),

          orderStatus: item.orderStatus,

          deliveryPartner: item.deliveryPartner || null,
          acceptedAt: item.acceptedAt || null,
          deliveredAt: item.deliveredAt || null,
        })),

        shippingAddress: order.shippingAddress,
        deliveryContact: order.deliveryContact,

        pricing: order.pricing,
      },
    });
  } catch (error) {
    console.error("Get Mobile Seller Single Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mobile seller order.",
    });
  }
};

// ======================================================
// UPDATE MOBILE SELLER ORDER STATUS
// ======================================================

export const updateMobileSellerOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Seller access required.",
      });
    }

    const { orderId } = req.params;
    const { status, itemIndex } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (!SELLER_ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller order status.",
      });
    }

    const seller = await Seller.findOne({
      userId: req.user._id,
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    const order = await MobileOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Mobile order not found.",
      });
    }

    /*
     * Seller can only modify items while the parent order
     * is still in the initial ordered state.
     */
    if (!["ordered", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "This order can no longer be updated by the seller.",
      });
    }

    // ==================================================
    // SINGLE ITEM UPDATE
    // ==================================================

    if (itemIndex !== undefined && itemIndex !== null) {
      const numericIndex = Number(itemIndex);

      if (
        !Number.isInteger(numericIndex) ||
        numericIndex < 0 ||
        numericIndex >= order.items.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid item index.",
        });
      }

      const item = order.items[numericIndex];

      if (String(item.seller) !== String(seller._id)) {
        return res.status(403).json({
          success: false,
          message: "You cannot update this order item.",
        });
      }

      if (item.orderStatus !== "ordered") {
        return res.status(400).json({
          success: false,
          message: "This order item has already been processed.",
        });
      }

      item.orderStatus = status;
    } else {
      // ==================================================
      // UPDATE ALL SELLER ITEMS
      // ==================================================

      let updatedCount = 0;

      for (const item of order.items) {
        if (
          String(item.seller) === String(seller._id) &&
          item.orderStatus === "ordered"
        ) {
          item.orderStatus = status;
          updatedCount++;
        }
      }

      if (updatedCount === 0) {
        return res.status(400).json({
          success: false,
          message: "No pending mobile order items found for this seller.",
        });
      }
    }

    // ==================================================
    // UPDATE PARENT ORDER STATUS
    // ==================================================

    const allItemsResolved = order.items.every((item) =>
      COMPLETED_ITEM_STATUSES.includes(item.orderStatus),
    );

    const hasDeliverableItems = order.items.some(
      (item) => item.orderStatus === "confirmed",
    );

    const allItemsUnavailable = order.items.every(
      (item) => item.orderStatus === "notAvailable",
    );

    // -------------------------------------------------------
    // UPDATE PARENT ORDER STATUS
    // -------------------------------------------------------

    // All items are not available
    if (allItemsUnavailable) {
      order.orderStatus = "notAvailable";
    }

    // At least one item is confirmed and all items are resolved
    else if (
      allItemsResolved &&
      hasDeliverableItems &&
      order.orderStatus === "ordered"
    ) {
      order.orderStatus = "confirmed";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Mobile order status updated successfully.",
      orderId: order._id,
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    console.error("Update Mobile Seller Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update mobile order status.",
    });
  }
};
