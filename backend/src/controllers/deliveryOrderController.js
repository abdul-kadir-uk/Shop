import mongoose from "mongoose";

import Order from "../models/Order.js";
import DeliveryPartner from "../models/DeliveryPartner.js";

import {
  ORDER_STATUS,
  DELIVERY_ALLOWED_STATUS,
  PAYMENT_STATUS,
} from "../constants/orderStatus.js";

// ======================================================
// Get Available Delivery Orders
// ======================================================
// A delivery partner can see and accept an order
// immediately after the customer places it.
//
// Seller confirmation is NOT required for acceptance.
// ======================================================

export const getAvailableDeliveryOrders = async (req, res) => {
  try {
    // --------------------------------------------------
    // Make sure logged-in user is a delivery partner
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
    });

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    // --------------------------------------------------
    // Find orders that:
    //
    // 1. Are still ordered
    // 2. Have not already been assigned
    //
    // IMPORTANT:
    // We do NOT check item.orderStatus here.
    // Seller confirmation is not required.
    // --------------------------------------------------

    const orders = await Order.find({
      orderStatus: ORDER_STATUS.ORDERED,
      "items.deliveryPartner": null,
    })
      .populate("customer", "name email mobile")
      .populate("items.seller", "shopName address")
      .populate("items.product", "productName slug")
      .sort({ createdAt: -1 })
      .lean();

    // --------------------------------------------------
    // Only return orders that still have at least one
    // unassigned delivery partner.
    // --------------------------------------------------

    const availableOrders = orders.filter((order) => {
      return order.items.some((item) => !item.deliveryPartner);
    });

    // --------------------------------------------------
    // Pagination after filtering
    // --------------------------------------------------

    const totalOrders = availableOrders.length;
    const totalPages = Math.ceil(totalOrders / limit);

    const paginatedOrders = availableOrders.slice(skip, skip + limit);

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
// A delivery partner accepts the WHOLE order.
//
// Seller confirmation is NOT required.
// ======================================================

export const acceptDeliveryOrder = async (req, res) => {
  try {
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
    // Atomically claim the WHOLE order
    //
    // The order must:
    //
    // 1. Still be ordered
    // 2. Not already have a delivery partner
    //
    // We check that no item has a delivery partner.
    // --------------------------------------------------

    const result = await Order.updateOne(
      {
        _id: orderId,
        orderStatus: ORDER_STATUS.ORDERED,

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
    // Order was already accepted / unavailable
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
// Returns WHOLE orders accepted by this delivery partner.
//
// Seller item statuses are included so the frontend can
// determine whether "Out for Delivery" is allowed.
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
    // Pending
    // --------------------------------------------------

    let orderStatusQuery;

    if (status === "pending") {
      orderStatusQuery = {
        $in: [ORDER_STATUS.ORDERED, ORDER_STATUS.OUT_FOR_DELIVERY],
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
    // Find orders assigned to this delivery partner
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
    // Return the COMPLETE order.
    //
    // Do NOT filter individual items here.
    //
    // The delivery partner accepted the whole order.
    // --------------------------------------------------

    const myOrders = orders.map((order) => {
      // ------------------------------------------------
      // Determine whether every item is resolved
      //
      // Seller-resolved means:
      // confirmed OR notAvailable
      // ------------------------------------------------

      const allItemsResolved = order.items.every(
        (item) =>
          item.orderStatus === ORDER_STATUS.CONFIRMED ||
          item.orderStatus === ORDER_STATUS.NOT_AVAILABLE,
      );

      // ------------------------------------------------
      // There must be at least one deliverable item
      // for the order to go out for delivery.
      // ------------------------------------------------

      const hasDeliverableItems = order.items.some(
        (item) => item.orderStatus === ORDER_STATUS.CONFIRMED,
      );

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
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
        // Frontend can directly use this.
        // ------------------------------------------------

        canStartDelivery:
          order.orderStatus === ORDER_STATUS.ORDERED &&
          allItemsResolved &&
          hasDeliverableItems,
      };
    });

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const totalOrders = myOrders.length;
    const totalPages = Math.ceil(totalOrders / limit);

    const paginatedOrders = myOrders.slice(skip, skip + limit);

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
// Delivery partner updates the WHOLE order.
//
// ordered
//    ↓
// outForDelivery
//    ↓
// delivered / cancelled
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
    // Make sure this delivery partner owns the order
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
      // Order must still be ordered
      // ------------------------------------------------

      if (order.orderStatus !== ORDER_STATUS.ORDERED) {
        return res.status(400).json({
          success: false,
          message: `Order cannot be started because it is already ${order.orderStatus}.`,
        });
      }

      // ------------------------------------------------
      // ALL items must be seller-resolved
      //
      // Valid:
      // confirmed
      // notAvailable
      //
      // Invalid:
      // ordered
      // ------------------------------------------------

      const allItemsResolved = order.items.every(
        (item) =>
          item.orderStatus === ORDER_STATUS.CONFIRMED ||
          item.orderStatus === ORDER_STATUS.NOT_AVAILABLE,
      );

      if (!allItemsResolved) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery cannot start until all order items are resolved by sellers.",
        });
      }

      // ------------------------------------------------
      // At least one item must actually be deliverable
      // ------------------------------------------------

      const hasDeliverableItems = order.items.some(
        (item) => item.orderStatus === ORDER_STATUS.CONFIRMED,
      );

      if (!hasDeliverableItems) {
        return res.status(400).json({
          success: false,
          message: "This order has no available items to deliver.",
        });
      }

      // ------------------------------------------------
      // Start whole order
      // ------------------------------------------------

      order.orderStatus = ORDER_STATUS.OUT_FOR_DELIVERY;

      await order.save();

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
      // Order must currently be out for delivery
      // ------------------------------------------------

      if (order.orderStatus !== ORDER_STATUS.OUT_FOR_DELIVERY) {
        return res.status(400).json({
          success: false,
          message: "Only an out-for-delivery order can be marked as delivered.",
        });
      }

      // ------------------------------------------------
      // Update whole order
      // ------------------------------------------------

      order.orderStatus = ORDER_STATUS.DELIVERED;

      // ------------------------------------------------
      // Mark confirmed items as delivered
      //
      // notAvailable items remain notAvailable.
      // ------------------------------------------------

      for (const item of order.items) {
        if (item.orderStatus === ORDER_STATUS.CONFIRMED) {
          item.orderStatus = ORDER_STATUS.DELIVERED;
          item.deliveredAt = new Date();
        }
      }

      // ------------------------------------------------
      // COD payment is paid when delivery completes
      // ------------------------------------------------

      order.paymentStatus = PAYMENT_STATUS.PAID;

      await order.save();

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
      // Cannot cancel after delivery
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
      // Keep seller item statuses intact.
      //
      // We intentionally do NOT change item.orderStatus
      // here because those statuses belong to seller
      // availability.
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
