// controllers/deliveryOrderController.js

import mongoose from "mongoose";
import Order from "../models/Order.js";
import DeliveryPartner from "../models/DeliveryPartner.js";

import {
  ORDER_STATUS,
  DELIVERY_ALLOWED_STATUS,
  PAYMENT_STATUS,
} from "../constants/orderStatus.js";

import {
  notifyCustomerDeliveryAccepted,
  notifyCustomerOutForDelivery,
  notifyCustomerOrderDelivered,
} from "../services/telegramNotificationService.js";

// ======================================================
// Helper: Check whether item is seller-resolved
// ======================================================
//
// Seller-resolved statuses:
// confirmed
// notAvailable
// cancelled
//
// NOTE:
// For starting delivery, cancelled is NOT treated as
// a deliverable item, but it is considered resolved.
// ======================================================

const isItemResolved = (item) => {
  return (
    item.orderStatus === ORDER_STATUS.CONFIRMED ||
    item.orderStatus === ORDER_STATUS.NOT_AVAILABLE ||
    item.orderStatus === ORDER_STATUS.CANCELLED
  );
};

// ======================================================
// Helper: Check whether all items are resolved
// ======================================================

const areAllItemsResolved = (items = []) => {
  if (items.length === 0) {
    return false;
  }

  return items.every((item) => isItemResolved(item));
};

// ======================================================
// Helper: Check whether order has deliverable items
// ======================================================
//
// Only CONFIRMED items can actually be delivered.
//
// NOT_AVAILABLE / CANCELLED items are not deliverable.
// ======================================================

const hasDeliverableItems = (items = []) => {
  return items.some((item) => item.orderStatus === ORDER_STATUS.CONFIRMED);
};

// ======================================================
// Get Available Delivery Orders
// ======================================================
//
// A delivery partner can see and accept an order as soon
// as the customer places it.
//
// Seller confirmation is NOT required.
//
// Example:
//
// Parent order:
// ordered
//
// Item:
// ordered
// deliveryPartner: null
//
// The order IS available.
// ======================================================

export const getAvailableDeliveryOrders = async (req, res) => {
  try {
    // --------------------------------------------------
    // Check role
    // --------------------------------------------------

    if (req.user.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Only delivery partners can access delivery orders.",
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

    // --------------------------------------------------
    // Assigned cities
    // --------------------------------------------------

    const assignedCities = deliveryPartner.assignedCities || [];

    if (assignedCities.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        totalOrders: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
        orders: [],
      });
    }

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    // --------------------------------------------------
    // Find available orders
    // --------------------------------------------------
    //
    // An order is available when:
    //
    // 1. Parent order status is either:
    //      - ordered
    //      - confirmed
    //
    // 2. Order belongs to one of the delivery partner's
    //    assigned cities.
    //
    // 3. At least one item has no delivery partner assigned.
    //
    // We intentionally do NOT check item.orderStatus here.
    // --------------------------------------------------

    const orders = await Order.find({
      orderStatus: {
        $in: [ORDER_STATUS.ORDERED, ORDER_STATUS.CONFIRMED],
      },

      "shippingAddress.city._id": {
        $in: assignedCities,
      },

      items: {
        $elemMatch: {
          deliveryPartner: null,
        },
      },
    })
      .populate("customer", "name email mobile")
      .populate("items.seller", "shopName address")
      .populate("items.product", "productName slug")
      .sort({ createdAt: -1 })
      .lean();

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const totalOrders = orders.length;
    const totalPages = Math.ceil(totalOrders / limit);

    const paginatedOrders = orders.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      count: paginatedOrders.length,
      totalOrders,
      totalPages,
      page,
      limit,
      orders: paginatedOrders,
    });
  } catch (error) {
    console.error("Get Available Delivery Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available delivery orders.",
    });
  }
};

// ======================================================
// Accept Delivery Order
// ======================================================
//
// Delivery partner accepts the WHOLE order.
//
// Seller confirmation is NOT required.
//
// The order remains:
//
// orderStatus = ordered
//
// Only deliveryPartner / acceptedAt are assigned.
// ======================================================

export const acceptDeliveryOrder = async (req, res) => {
  try {
    // --------------------------------------------------
    // Check role
    // --------------------------------------------------

    if (req.user.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Only delivery partners can accept delivery orders.",
      });
    }

    const { orderId } = req.params;

    // --------------------------------------------------
    // Validate order ID
    // --------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    // --------------------------------------------------
    // Find delivery partner
    // --------------------------------------------------

    const deliveryPartner = await DeliveryPartner.findOne({
      userId: req.user._id,
    });

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    // --------------------------------------------------
    // Atomically claim whole order
    // --------------------------------------------------
    //
    // IMPORTANT:
    //
    // We require:
    //
    // parent order = ordered
    //
    // AND every item is currently unassigned.
    //
    // Item status does NOT matter.
    //
    // Therefore an item with:
    //
    // ordered
    // confirmed
    // notAvailable
    //
    // can still be part of the accepted order.
    // --------------------------------------------------

    const result = await Order.updateOne(
      {
        _id: orderId,

        orderStatus: {
          $in: [ORDER_STATUS.ORDERED, ORDER_STATUS.CONFIRMED],
        },

        items: {
          $not: {
            $elemMatch: {
              deliveryPartner: {
                $ne: null,
              },
            },
          },
        },
      },
      {
        $set: {
          "items.$[].deliveryPartner": deliveryPartner._id,
          "items.$[].acceptedAt": new Date(),
        },
      },
    );

    // --------------------------------------------------
    // Already accepted
    // --------------------------------------------------

    if (result.modifiedCount === 0) {
      return res.status(409).json({
        success: false,
        message:
          "This order is no longer available. It may have already been accepted by another delivery partner.",
      });
    }

    // --------------------------------------------------
    // Get updated order
    // --------------------------------------------------

    const updatedOrder = await Order.findById(orderId)
      .populate("customer", "name email mobile")
      .populate("items.seller", "shopName address")
      .populate("items.product", "productName slug")
      .lean();

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found after assignment.",
      });
    }

    // --------------------------------------------------
    // Notification
    // --------------------------------------------------

    notifyCustomerDeliveryAccepted(updatedOrder).catch((error) => {
      console.error("Delivery Accepted Telegram Error:", error);
    });

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Order accepted successfully.",
      order: {
        _id: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        orderStatus: updatedOrder.orderStatus,
        customer: updatedOrder.customer,
        shippingAddress: updatedOrder.shippingAddress,
        deliveryContact: updatedOrder.deliveryContact,
        items: updatedOrder.items,
        pricing: updatedOrder.pricing,
        paymentMethod: updatedOrder.paymentMethod,
        paymentStatus: updatedOrder.paymentStatus,
        createdAt: updatedOrder.createdAt,
      },
    });
  } catch (error) {
    console.error("Accept Delivery Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept delivery order.",
    });
  }
};

// ======================================================
// Get My Delivery Orders
// ======================================================
//
// Returns WHOLE orders accepted by this delivery partner.
//
// IMPORTANT:
//
// Seller changing:
//
// item.orderStatus
//
// from:
//
// ordered
//
// to:
//
// confirmed
//
// MUST NOT remove the order.
//
// The parent orderStatus remains:
//
// ordered
//
// until delivery partner starts delivery.
// ======================================================

export const getMyDeliveryOrders = async (req, res) => {
  try {
    // --------------------------------------------------
    // Check role
    // --------------------------------------------------

    if (req.user.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Only delivery partners can access their deliveries.",
      });
    }

    // --------------------------------------------------
    // Find delivery partner
    // --------------------------------------------------

    const deliveryPartner = await DeliveryPartner.findOne({
      userId: req.user._id,
    });

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    // --------------------------------------------------
    // Status filter
    // --------------------------------------------------

    const { status = "pending" } = req.query;

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    // --------------------------------------------------
    // Parent order status
    // --------------------------------------------------
    //
    // IMPORTANT:
    //
    // Seller item status is NOT used here.
    //
    // Pending means the DELIVERY process has not finished.
    //
    // ordered:
    // Seller may still be resolving items.
    //
    // outForDelivery:
    // Delivery is currently active.
    // --------------------------------------------------

    let orderStatusQuery;

    if (status === "pending") {
      orderStatusQuery = {
        $in: [
          ORDER_STATUS.ORDERED,
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.OUT_FOR_DELIVERY,
        ],
      };
    } else if (status === "completed") {
      orderStatusQuery = {
        $in: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter. Use pending or completed.",
      });
    }

    // --------------------------------------------------
    // Find orders
    // --------------------------------------------------
    //
    // IMPORTANT:
    //
    // We only require that this delivery partner is
    // assigned to at least one item.
    //
    // We DO NOT filter item.orderStatus.
    //
    // Therefore:
    //
    // ordered item       -> visible
    // confirmed item     -> visible
    // notAvailable item  -> visible
    //
    // as long as parent order is pending.
    // --------------------------------------------------

    const orders = await Order.find({
      orderStatus: orderStatusQuery,

      items: {
        $elemMatch: {
          deliveryPartner: deliveryPartner._id,
        },
      },
    })
      .populate("customer", "name email mobile")
      .populate("items.seller", "shopName address")
      .populate("items.product", "productName slug")
      .sort({ createdAt: -1 })
      .lean();

    // --------------------------------------------------
    // Build response
    // --------------------------------------------------

    const myOrders = orders.map((order) => {
      // ------------------------------------------------
      // Are ALL items resolved?
      // ------------------------------------------------

      const allItemsResolved = areAllItemsResolved(order.items);

      // ------------------------------------------------
      // Does the order contain a confirmed item?
      // ------------------------------------------------

      const orderHasDeliverableItems = hasDeliverableItems(order.items);

      // ------------------------------------------------
      // Can delivery start?
      //
      // Parent order MUST still be ordered.
      //
      // ALL items must be resolved.
      //
      // At least one item must be confirmed.
      // ------------------------------------------------

      const canStartDelivery =
        order.orderStatus === ORDER_STATUS.CONFIRMED &&
        allItemsResolved &&
        orderHasDeliverableItems;

      return {
        _id: order._id,
        orderNumber: order.orderNumber,

        // IMPORTANT:
        // This is the DELIVERY/WHOLE ORDER status.
        orderStatus: order.orderStatus,

        customer: order.customer,

        shippingAddress: order.shippingAddress,

        deliveryContact: order.deliveryContact,

        items: order.items,

        pricing: order.pricing,

        paymentMethod: order.paymentMethod,

        paymentStatus: order.paymentStatus,

        createdAt: order.createdAt,

        // ------------------------------------------------
        // Seller resolution state
        // ------------------------------------------------

        canStartDelivery,

        // These are useful for frontend debugging/UI.
        allItemsResolved,

        hasDeliverableItems: orderHasDeliverableItems,
      };
    });

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const totalOrders = myOrders.length;
    const totalPages = Math.ceil(totalOrders / limit);

    const paginatedOrders = myOrders.slice(skip, skip + limit);

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      status,
      count: paginatedOrders.length,
      totalOrders,
      totalPages,
      page,
      limit,
      orders: paginatedOrders,
    });
  } catch (error) {
    console.error("Get My Delivery Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your delivery orders.",
    });
  }
};

// ======================================================
// Update Delivery Order Status
// ======================================================
//
// Delivery partner updates WHOLE ORDER.
//
// ordered
//    ↓
// outForDelivery
//    ↓
// delivered
//
// OR
//
// ordered / outForDelivery
//    ↓
// cancelled
// ======================================================

export const updateDeliveryOrderStatus = async (req, res) => {
  try {
    // --------------------------------------------------
    // Check role
    // --------------------------------------------------

    if (req.user.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Only delivery partners can update delivery status.",
      });
    }

    // --------------------------------------------------
    // Find delivery partner
    // --------------------------------------------------

    const deliveryPartner = await DeliveryPartner.findOne({
      userId: req.user._id,
    });

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    // --------------------------------------------------
    // Params / body
    // --------------------------------------------------

    const { orderId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    // --------------------------------------------------
    // Validate requested status
    // --------------------------------------------------

    if (!DELIVERY_ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status.",
      });
    }

    // --------------------------------------------------
    // Find order
    // --------------------------------------------------

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // --------------------------------------------------
    // Make sure delivery partner owns order
    // --------------------------------------------------

    const assignedToThisPartner = order.items.some(
      (item) =>
        item.deliveryPartner &&
        item.deliveryPartner.toString() === deliveryPartner._id.toString(),
    );

    if (!assignedToThisPartner) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this order.",
      });
    }

    // ==================================================
    // START DELIVERY
    // ==================================================

    if (status === ORDER_STATUS.OUT_FOR_DELIVERY) {
      // ------------------------------------------------
      // Parent order must still be confirmed
      // ------------------------------------------------

      if (order.orderStatus !== ORDER_STATUS.CONFIRMED) {
        return res.status(400).json({
          success: false,
          message: `Order cannot be started because it is already ${order.orderStatus}.`,
        });
      }

      // ------------------------------------------------
      // ALL items must be resolved
      //
      // accepted:
      // confirmed
      // notAvailable
      // cancelled
      //
      // ordered is NOT allowed.
      // ------------------------------------------------

      const allItemsResolved = areAllItemsResolved(order.items);

      if (!allItemsResolved) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery cannot start until all order items are resolved by sellers.",
        });
      }

      // ------------------------------------------------
      // At least one confirmed item must exist
      // ------------------------------------------------

      const orderHasDeliverableItems = hasDeliverableItems(order.items);

      if (!orderHasDeliverableItems) {
        return res.status(400).json({
          success: false,
          message: "This order has no available items to deliver.",
        });
      }

      // ------------------------------------------------
      // Change parent order status ONLY here
      // ------------------------------------------------

      order.orderStatus = ORDER_STATUS.OUT_FOR_DELIVERY;

      await order.save();

      // ------------------------------------------------
      // Notification
      // ------------------------------------------------

      notifyCustomerOutForDelivery(order).catch((error) => {
        console.error("Out For Delivery Telegram Error:", error);
      });

      return res.status(200).json({
        success: true,
        message: "Order is now out for delivery.",
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
      });
    }

    // ==================================================
    // DELIVERED
    // ==================================================

    if (status === ORDER_STATUS.DELIVERED) {
      // ------------------------------------------------
      // Order must be out for delivery
      // ------------------------------------------------

      if (order.orderStatus !== ORDER_STATUS.OUT_FOR_DELIVERY) {
        return res.status(400).json({
          success: false,
          message: "Only an out-for-delivery order can be marked as delivered.",
        });
      }

      // ------------------------------------------------
      // Update parent order
      // ------------------------------------------------

      order.orderStatus = ORDER_STATUS.DELIVERED;

      // ------------------------------------------------
      // Confirmed items become delivered.
      //
      // notAvailable items remain notAvailable.
      // cancelled items remain cancelled.
      // ------------------------------------------------

      for (const item of order.items) {
        if (item.orderStatus === ORDER_STATUS.CONFIRMED) {
          item.orderStatus = ORDER_STATUS.DELIVERED;
          item.deliveredAt = new Date();
        }
      }

      // ------------------------------------------------
      // COD payment becomes paid
      // ------------------------------------------------

      order.paymentStatus = PAYMENT_STATUS.PAID;

      await order.save();

      // ------------------------------------------------
      // Notification
      // ------------------------------------------------

      notifyCustomerOrderDelivered(order).catch((error) => {
        console.error("Order Delivered Telegram Error:", error);
      });

      return res.status(200).json({
        success: true,
        message: "Order delivered successfully.",
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      });
    }

    // ==================================================
    // CANCELLED
    // ==================================================

    if (status === ORDER_STATUS.CANCELLED) {
      // ------------------------------------------------
      // Cannot cancel completed order
      // ------------------------------------------------

      if (
        order.orderStatus === ORDER_STATUS.DELIVERED ||
        order.orderStatus === ORDER_STATUS.CANCELLED
      ) {
        return res.status(400).json({
          success: false,
          message: `Order is already ${order.orderStatus}.`,
        });
      }

      // ------------------------------------------------
      // Cancel whole order
      // ------------------------------------------------

      order.orderStatus = ORDER_STATUS.CANCELLED;

      // ------------------------------------------------
      // IMPORTANT:
      //
      // Do NOT overwrite seller item statuses.
      //
      // Example:
      //
      // item A = confirmed
      // item B = notAvailable
      //
      // Those remain as seller resolution statuses.
      // ------------------------------------------------

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Order cancelled successfully.",
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
      });
    }

    // ==================================================
    // Unsupported
    // ==================================================

    return res.status(400).json({
      success: false,
      message: "Unsupported delivery status.",
    });
  } catch (error) {
    console.error("Update Delivery Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update delivery status.",
    });
  }
};
