// controllers/adminOrderController.js

import mongoose from "mongoose";

import Order from "../models/Order.js";

import { ORDER_STATUS, PAYMENT_STATUS } from "../constants/orderStatus.js";

/* ==========================================================
   Admin Order Controller
========================================================== */

/*
  Admin has complete control over the parent order.

  Valid parent statuses:

  ordered
  confirmed
  notAvailable
  outForDelivery
  delivered
  cancelled

  Important:

  - Seller works on item.orderStatus.
  - Delivery partner works on parent orderStatus.
  - Admin can directly change parent orderStatus.
  - Admin does not need seller confirmation.
  - Admin does not need delivery partner assignment.
*/

/* ==========================================================
   Helper: Populate Complete Order
========================================================== */

const populateCompleteOrder = (query) => {
  return query
    .populate("customer", "name email mobile")
    .populate("items.product", "productName slug")
    .populate("items.seller", "shopName address")
    .populate("items.deliveryPartner", "name userId assignedCities");
};

/* ==========================================================
   GET ALL ADMIN ORDERS
   GET /api/admin/orders
==========================================================

   Available orders means every order which is not:

   delivered
   cancelled

   So admin can see:

   ordered
   confirmed
   notAvailable
   outForDelivery
========================================================== */

export const getAdminOrders = async (req, res) => {
  try {
    // ------------------------------------------------------
    // Pagination
    // ------------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

    const skip = (page - 1) * limit;

    // ------------------------------------------------------
    // Optional status filter
    // ------------------------------------------------------

    const { status = "" } = req.query;

    const query = {};

    // ------------------------------------------------------
    // If admin specifically asks for a status
    // ------------------------------------------------------

    if (status) {
      if (!Object.values(ORDER_STATUS).includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status.",
          allowedStatuses: Object.values(ORDER_STATUS),
        });
      }

      query.orderStatus = status;
    }

    // ------------------------------------------------------
    // Default:
    //
    // Available/admin active orders
    //
    // Do not show delivered/cancelled here.
    // ------------------------------------------------------

    if (!status) {
      query.orderStatus = {
        $nin: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
      };
    }

    // ------------------------------------------------------
    // Count
    // ------------------------------------------------------

    const totalOrders = await Order.countDocuments(query);

    // ------------------------------------------------------
    // Fetch
    // ------------------------------------------------------

    const orders = await populateCompleteOrder(
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ).lean();

    // ------------------------------------------------------
    // Response
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,

      page,

      limit,

      totalOrders,

      totalPages: Math.ceil(totalOrders / limit),

      orders,
    });
  } catch (error) {
    console.error("Get Admin Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin orders.",
    });
  }
};

/* ==========================================================
   GET SINGLE ADMIN ORDER
   GET /api/admin/orders/:orderId
========================================================== */

export const getAdminSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // ------------------------------------------------------
    // Validate ObjectId
    // ------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    // ------------------------------------------------------
    // Find order
    // ------------------------------------------------------

    const order = await populateCompleteOrder(Order.findById(orderId)).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // ------------------------------------------------------
    // Response
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Admin Single Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order.",
    });
  }
};

/* ==========================================================
   UPDATE ADMIN ORDER STATUS
   PATCH /api/admin/orders/:orderId/status
==========================================================

   Admin can directly set:

   ordered
   confirmed
   notAvailable
   outForDelivery
   delivered
   cancelled

   There are intentionally NO seller/delivery restrictions
   here because admin has complete control.
========================================================== */

export const updateAdminOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

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
    // Validate status
    // ------------------------------------------------------

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Order status is required.",
      });
    }

    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
        allowedStatuses: Object.values(ORDER_STATUS),
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
    // Already same status
    // ------------------------------------------------------

    if (order.orderStatus === status) {
      return res.status(200).json({
        success: true,
        message: `Order is already ${status}.`,
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
        },
      });
    }

    const previousStatus = order.orderStatus;

    // ======================================================
    // ADMIN STATUS UPDATE
    // ======================================================

    order.orderStatus = status;

    // ======================================================
    // DELIVERED
    // ======================================================
    //
    // Admin can force an order to delivered even if:
    //
    // - seller has not resolved everything
    // - delivery partner has not started delivery
    // - delivery partner is not assigned
    //
    // Because admin has complete control.
    //
    // But we still keep item-level information meaningful:
    //
    // confirmed / ordered
    //        -> delivered
    //
    // notAvailable
    //        -> remains notAvailable
    //
    // cancelled
    //        -> remains cancelled
    // ======================================================

    if (status === ORDER_STATUS.DELIVERED) {
      for (const item of order.items) {
        if (
          item.orderStatus === ORDER_STATUS.CONFIRMED ||
          item.orderStatus === ORDER_STATUS.ORDERED
        ) {
          item.orderStatus = ORDER_STATUS.DELIVERED;
          item.deliveredAt = new Date();
        }
      }

      // ----------------------------------------------------
      // COD payment is considered paid after delivery
      // ----------------------------------------------------

      order.paymentStatus = PAYMENT_STATUS.PAID;
    }

    // ======================================================
    // CANCELLED
    // ======================================================
    //
    // IMPORTANT:
    //
    // Do NOT overwrite item statuses.
    //
    // This follows your existing delivery cancellation
    // behavior.
    //
    // Example:
    //
    // item A -> confirmed
    // item B -> notAvailable
    //
    // Parent:
    // cancelled
    //
    // Item statuses remain unchanged.
    // ======================================================

    if (status === ORDER_STATUS.CANCELLED) {
      // Intentionally do nothing to item.orderStatus.
    }

    // ======================================================
    // CONFIRMED
    // ======================================================
    //
    // Admin only changes the parent status.
    //
    // We do NOT change every item to confirmed because
    // sellers may have individual item statuses such as:
    //
    // confirmed
    // notAvailable
    // ordered
    //
    // Admin parent status and seller item status remain
    // separate.
    // ======================================================

    if (status === ORDER_STATUS.CONFIRMED) {
      // Parent status already updated above.
    }

    // ======================================================
    // OUT FOR DELIVERY
    // ======================================================
    //
    // Admin can force this status.
    //
    // We do NOT require:
    //
    // - all items resolved
    // - delivery partner assigned
    // - previous status confirmed
    //
    // Those restrictions belong to the delivery partner.
    // ======================================================

    if (status === ORDER_STATUS.OUT_FOR_DELIVERY) {
      // Parent status already updated above.
    }

    // ======================================================
    // NOT AVAILABLE
    // ======================================================
    //
    // This is allowed because it exists in ORDER_STATUS.
    //
    // Admin is allowed to set any valid parent status.
    // ======================================================

    if (status === ORDER_STATUS.NOT_AVAILABLE) {
      // Parent status already updated above.
    }

    // ======================================================
    // ORDERED
    // ======================================================
    //
    // Admin can move an order back to ordered if required.
    // ======================================================

    if (status === ORDER_STATUS.ORDERED) {
      // Parent status already updated above.
    }

    // ------------------------------------------------------
    // Save
    // ------------------------------------------------------

    await order.save();

    // ------------------------------------------------------
    // Get updated populated order
    // ------------------------------------------------------

    const updatedOrder = await populateCompleteOrder(
      Order.findById(order._id),
    ).lean();

    // ------------------------------------------------------
    // Response
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,

      message: `Order status updated from ${previousStatus} to ${status}.`,

      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update Admin Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  }
};

/* ==========================================================
   GET COMPLETED ORDERS
   GET /api/admin/orders/completed
==========================================================

   Completed orders:
   parent orderStatus = delivered
========================================================== */

export const getAdminCompletedOrders = async (req, res) => {
  try {
    // ------------------------------------------------------
    // Pagination
    // ------------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

    const skip = (page - 1) * limit;

    // ------------------------------------------------------
    // Query
    // ------------------------------------------------------

    const query = {
      orderStatus: ORDER_STATUS.DELIVERED,
    };

    // ------------------------------------------------------
    // Count
    // ------------------------------------------------------

    const totalOrders = await Order.countDocuments(query);

    // ------------------------------------------------------
    // Fetch
    // ------------------------------------------------------

    const orders = await populateCompleteOrder(
      Order.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    ).lean();

    // ------------------------------------------------------
    // Response
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,

      page,

      limit,

      totalOrders,

      totalPages: Math.ceil(totalOrders / limit),

      orders,
    });
  } catch (error) {
    console.error("Get Admin Completed Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch completed orders.",
    });
  }
};

/* ==========================================================
   GET CANCELLED ORDERS
   GET /api/admin/orders/cancelled
========================================================== */

export const getAdminCancelledOrders = async (req, res) => {
  try {
    // ------------------------------------------------------
    // Pagination
    // ------------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

    const skip = (page - 1) * limit;

    // ------------------------------------------------------
    // Query
    // ------------------------------------------------------

    const query = {
      orderStatus: ORDER_STATUS.CANCELLED,
    };

    // ------------------------------------------------------
    // Count
    // ------------------------------------------------------

    const totalOrders = await Order.countDocuments(query);

    // ------------------------------------------------------
    // Fetch
    // ------------------------------------------------------

    const orders = await populateCompleteOrder(
      Order.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    ).lean();

    // ------------------------------------------------------
    // Response
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,

      page,

      limit,

      totalOrders,

      totalPages: Math.ceil(totalOrders / limit),

      orders,
    });
  } catch (error) {
    console.error("Get Admin Cancelled Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch cancelled orders.",
    });
  }
};
