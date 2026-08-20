// controllers/sellerOrderController.js

import mongoose from "mongoose";

import Order from "../models/Order.js";
import Seller from "../models/Seller.js";

import {
  ORDER_STATUS,
  SELLER_ALLOWED_STATUS,
} from "../constants/orderStatus.js";

/* ==========================================================
   Seller Orders
   GET /api/seller/orders
========================================================== */

export const getSellerOrders = async (req, res) => {
  try {
    // ------------------------------------------------------
    // Check role
    // ------------------------------------------------------

    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Only sellers can access orders.",
      });
    }

    // ------------------------------------------------------
    // Find seller
    // ------------------------------------------------------

    const seller = await Seller.findOne({
      userId: req.user._id,
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    // ------------------------------------------------------
    // Pagination
    // ------------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    // ------------------------------------------------------
    // Status filter
    // ------------------------------------------------------

    const status = req.query.status || "";

    // ------------------------------------------------------
    // Base query
    //
    // Seller dashboard continues to work using
    // individual seller items.
    // ------------------------------------------------------

    const query = {
      items: {
        $elemMatch: {
          seller: seller._id,
        },
      },
    };

    // ------------------------------------------------------
    // Pending seller orders
    //
    // Seller still needs to resolve their items.
    // ------------------------------------------------------

    if (status === "ordered") {
      query.items.$elemMatch.orderStatus = ORDER_STATUS.ORDERED;
    }

    // ------------------------------------------------------
    // Completed seller orders
    //
    // Seller has already resolved their items.
    // ------------------------------------------------------

    if (status === "completed") {
      query.items.$elemMatch.orderStatus = {
        $in: [
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.NOT_AVAILABLE,
          ORDER_STATUS.DELIVERED,
          ORDER_STATUS.CANCELLED,
        ],
      };
    }

    // ------------------------------------------------------
    // Count
    // ------------------------------------------------------

    const totalOrders = await Order.countDocuments(query);

    // ------------------------------------------------------
    // Get orders
    // ------------------------------------------------------

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // ------------------------------------------------------
    // Format seller-specific view
    // ------------------------------------------------------

    const formattedOrders = orders.map((order) => {
      const sellerItems = order.items.filter(
        (item) => item.seller.toString() === seller._id.toString(),
      );

      const sellerTotal = sellerItems.reduce(
        (sum, item) => sum + item.subtotal,
        0,
      );

      return {
        _id: order._id,

        orderNumber: order.orderNumber,

        paymentStatus: order.paymentStatus,

        createdAt: order.createdAt,

        sellerTotal,

        totalItems: sellerItems.length,

        items: sellerItems.map((item) => ({
          product: item.product,

          productName: item.productName,

          image: item.image,

          quantity: item.quantity,

          variant: item.variant,

          price: item.price,

          discountPrice: item.discountPrice,

          subtotal: item.subtotal,

          // Seller continues to work with item status
          orderStatus: item.orderStatus,
        })),
      };
    });

    return res.status(200).json({
      success: true,

      page,

      limit,

      totalOrders,

      totalPages: Math.ceil(totalOrders / limit),

      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Seller Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller orders.",
    });
  }
};

/* ==========================================================
   Get Seller Single Order
   GET /api/seller/orders/:orderId
========================================================== */

export const getSellerSingleOrder = async (req, res) => {
  try {
    // ------------------------------------------------------
    // Check role
    // ------------------------------------------------------

    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Only sellers can access orders.",
      });
    }

    // ------------------------------------------------------
    // Find seller
    // ------------------------------------------------------

    const seller = await Seller.findOne({
      userId: req.user._id,
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    // ------------------------------------------------------
    // Validate order ID
    // ------------------------------------------------------

    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    // ------------------------------------------------------
    // Find combined order
    // ------------------------------------------------------

    const order = await Order.findById(orderId).select(
      "orderNumber paymentStatus createdAt items",
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // ------------------------------------------------------
    // Get only this seller's items
    // ------------------------------------------------------

    const sellerItems = order.items.filter(
      (item) => item.seller.toString() === seller._id.toString(),
    );

    if (sellerItems.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order.",
      });
    }

    // ------------------------------------------------------
    // Seller total
    // ------------------------------------------------------

    const sellerTotal = sellerItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );

    return res.status(200).json({
      success: true,

      order: {
        _id: order._id,

        orderNumber: order.orderNumber,

        paymentStatus: order.paymentStatus,

        createdAt: order.createdAt,

        sellerTotal,

        totalItems: sellerItems.length,

        items: sellerItems.map((item) => ({
          product: item.product,

          productName: item.productName,

          image: item.image,

          variant: item.variant,

          quantity: item.quantity,

          price: item.price,

          discountPrice: item.discountPrice,

          orderStatus: item.orderStatus,

          subtotal: item.subtotal,
        })),
      },
    });
  } catch (error) {
    console.error("Seller Order Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order.",
    });
  }
};

/* ==========================================================
   Seller Update Order Status
   PATCH /api/seller/orders/:orderId/status
========================================================== */

/* ==========================================================
Seller Update Order Status
PATCH /api/seller/orders/:orderId/status
========================================================== */

export const updateSellerOrderStatus = async (req, res) => {
  try {
    // ------------------------------------------------------
    // Check role
    // ------------------------------------------------------

    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Only sellers can update orders.",
      });
    }

    // ------------------------------------------------------
    // Find seller
    // ------------------------------------------------------

    const seller = await Seller.findOne({
      userId: req.user._id,
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    // ------------------------------------------------------
    // Params / Body
    // ------------------------------------------------------

    const { orderId } = req.params;
    const { itemIndex, status } = req.body;

    // ------------------------------------------------------
    // Validate order ID
    // ------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    // ------------------------------------------------------
    // Validate seller status
    // ------------------------------------------------------

    if (!SELLER_ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Seller can only set confirmed or notAvailable.",
      });
    }

    // ------------------------------------------------------
    // Find order
    // ------------------------------------------------------

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // ------------------------------------------------------
    // Seller should only resolve orders that are still
    // waiting for seller confirmation.
    // ------------------------------------------------------

    if (
      order.orderStatus !== ORDER_STATUS.ORDERED &&
      order.orderStatus !== ORDER_STATUS.CONFIRMED
    ) {
      return res.status(400).json({
        success: false,
        message: `This order cannot be updated because it is already ${order.orderStatus}.`,
      });
    }

    // ------------------------------------------------------
    // Check whether this is:
    //
    // 1. Single item update
    // 2. All seller items update
    //
    // itemIndex present  => single item
    // itemIndex missing  => all seller items
    // ------------------------------------------------------

    const isSingleItemUpdate =
      itemIndex !== undefined && itemIndex !== null && itemIndex !== "";

    const updatedItems = [];

    // ======================================================
    // SINGLE ITEM UPDATE
    // ======================================================

    if (isSingleItemUpdate) {
      const index = Number(itemIndex);

      // ----------------------------------------------------
      // Validate item index
      // ----------------------------------------------------

      if (!Number.isInteger(index) || index < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid item index.",
        });
      }

      // ----------------------------------------------------
      // Find requested item
      // ----------------------------------------------------

      const item = order.items[index];

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Order item not found.",
        });
      }

      // ----------------------------------------------------
      // Make sure this item belongs to this seller
      // ----------------------------------------------------

      if (item.seller.toString() !== seller._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this item.",
        });
      }

      // ----------------------------------------------------
      // Only ordered -> confirmed / notAvailable
      // ----------------------------------------------------

      if (item.orderStatus !== ORDER_STATUS.ORDERED) {
        return res.status(400).json({
          success: false,
          message: `Item is already ${item.orderStatus}.`,
        });
      }

      // ----------------------------------------------------
      // Update selected item
      // ----------------------------------------------------

      item.orderStatus = status;

      updatedItems.push({
        item,
        index,
      });
    }

    // ======================================================
    // UPDATE ALL ITEMS BELONGING TO THIS SELLER
    // ======================================================
    else {
      order.items.forEach((item, index) => {
        // --------------------------------------------------
        // Only update this seller's items
        // --------------------------------------------------

        if (item.seller.toString() !== seller._id.toString()) {
          return;
        }

        // --------------------------------------------------
        // Only update unresolved ORDERED items
        // --------------------------------------------------

        if (item.orderStatus !== ORDER_STATUS.ORDERED) {
          return;
        }

        item.orderStatus = status;

        updatedItems.push({
          item,
          index,
        });
      });

      // ----------------------------------------------------
      // Seller has no pending items in this order
      // ----------------------------------------------------

      if (updatedItems.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "There are no pending items belonging to this seller in this order.",
        });
      }
    }

    // ------------------------------------------------------
    // Check whether ALL items in the combined order
    // have now been resolved by sellers.
    //
    // Resolved:
    // confirmed
    // notAvailable
    // cancelled
    // ------------------------------------------------------

    const allItemsResolved = order.items.every(
      (orderItem) =>
        orderItem.orderStatus === ORDER_STATUS.CONFIRMED ||
        orderItem.orderStatus === ORDER_STATUS.NOT_AVAILABLE ||
        orderItem.orderStatus === ORDER_STATUS.CANCELLED,
    );

    // ------------------------------------------------------
    // Check whether at least one item can actually be
    // delivered.
    // ------------------------------------------------------

    const hasDeliverableItems = order.items.some(
      (orderItem) => orderItem.orderStatus === ORDER_STATUS.CONFIRMED,
    );

    // ======================================================
    // IMPORTANT:
    //
    // Update the PARENT order status only after ALL items
    // have been resolved.
    // ======================================================

    if (
      allItemsResolved &&
      hasDeliverableItems &&
      order.orderStatus === ORDER_STATUS.ORDERED
    ) {
      order.orderStatus = ORDER_STATUS.CONFIRMED;
    }

    // ------------------------------------------------------
    // Save order
    // ------------------------------------------------------

    await order.save();

    // ------------------------------------------------------
    // Response
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,

      message: isSingleItemUpdate
        ? "Order item status updated successfully."
        : "All pending items belonging to this seller were updated successfully.",

      order: {
        _id: order._id,

        orderNumber: order.orderNumber,

        orderStatus: order.orderStatus,

        updatedItems: updatedItems.map(({ index, item }) => ({
          itemIndex: index,
          orderStatus: item.orderStatus,
        })),

        updatedCount: updatedItems.length,

        allItemsResolved,

        hasDeliverableItems,
      },
    });
  } catch (error) {
    console.error("Seller Update Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  }
};
