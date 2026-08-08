import mongoose from "mongoose";

import Order from "../models/Order.js";
import DeliveryPartner from "../models/DeliveryPartner.js";

import {
  ORDER_STATUS,
  DELIVERY_ALLOWED_STATUS,
} from "../constants/orderStatus.js";

// ======================================================
// Get Available Delivery Orders
// ======================================================
// Shows confirmed items that have NOT been accepted
// by any delivery partner yet.
//
// Every approved delivery partner can see these items.
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
    // Find orders containing confirmed,
    // unassigned items
    // --------------------------------------------------

    const orders = await Order.find({
      items: {
        $elemMatch: {
          orderStatus: ORDER_STATUS.CONFIRMED,
          deliveryPartner: null,
        },
      },
    })
      .populate("customer", "name email mobile")
      .populate("items.seller", "shopName")
      .populate("items.product", "productName slug")
      .sort({ createdAt: -1 });

    // --------------------------------------------------
    // Return only available items
    //
    // We don't want to expose unrelated items from
    // the same order to the delivery partner.
    // --------------------------------------------------

    const availableOrders = orders
      .map((order) => {
        const availableItems = order.items.filter(
          (item) =>
            item.orderStatus === ORDER_STATUS.CONFIRMED &&
            !item.deliveryPartner,
        );

        if (availableItems.length === 0) {
          return null;
        }

        return {
          _id: order._id,
          orderNumber: order.orderNumber,
          customer: order.customer,
          shippingAddress: order.shippingAddress,
          deliveryContact: order.deliveryContact,
          items: availableItems,
          pricing: order.pricing,
          createdAt: order.createdAt,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      count: availableOrders.length,
      orders: availableOrders,
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
// Accept Delivery Order Item
// ======================================================
// A delivery partner accepts ONE confirmed item.
//
// IMPORTANT:
// This uses an atomic MongoDB update so if two delivery
// partners try to accept the same item at the same time,
// only ONE of them can successfully claim it.
// ======================================================

export const acceptDeliveryOrder = async (req, res) => {
  try {
    const { orderId, itemIndex } = req.params;

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
    // Validate item index
    // --------------------------------------------------

    const index = Number(itemIndex);

    if (!Number.isInteger(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid item index.",
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
    // Atomically claim the item
    //
    // Conditions:
    //
    // 1. Correct order
    // 2. Correct item
    // 3. Item must be confirmed
    // 4. Item must not already have a delivery partner
    // --------------------------------------------------

    const result = await Order.updateOne(
      {
        _id: orderId,
        [`items.${index}`]: {
          $exists: true,
        },
        [`items.${index}.orderStatus`]: ORDER_STATUS.CONFIRMED,
        [`items.${index}.deliveryPartner`]: null,
      },
      {
        $set: {
          [`items.${index}.deliveryPartner`]: deliveryPartner._id,
          [`items.${index}.acceptedAt`]: new Date(),
        },
      },
    );

    // --------------------------------------------------
    // Nothing modified means the item was no longer
    // available or the item doesn't exist.
    // --------------------------------------------------

    if (result.modifiedCount === 0) {
      return res.status(409).json({
        success: false,
        message:
          "This delivery item is no longer available. It may have already been accepted by another delivery partner, or the seller has not confirmed it.",
      });
    }

    // --------------------------------------------------
    // Get updated order
    // --------------------------------------------------

    const updatedOrder = await Order.findById(orderId);

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found after assignment.",
      });
    }

    const item = updatedOrder.items[index];

    return res.status(200).json({
      success: true,
      message: "Delivery item accepted successfully.",
      orderId: updatedOrder._id,
      orderNumber: updatedOrder.orderNumber,
      itemIndex: index,
      deliveryPartner: item.deliveryPartner,
      acceptedAt: item.acceptedAt,
      orderStatus: item.orderStatus,
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
// Returns only items accepted by the logged-in delivery
// partner.
// ======================================================

// ======================================================
// Get My Delivery Orders
// ======================================================
// Default:
//
// GET /api/delivery/my-orders
//
// Returns pending delivery items:
// - confirmed
// - outForDelivery
//
// Completed:
//
// GET /api/delivery/my-orders?status=completed
//
// Returns completed delivery items:
// - delivered
// - cancelled
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
    //
    // Default = pending
    // --------------------------------------------------

    const { status = "pending" } = req.query;

    // --------------------------------------------------
    // Define status groups
    // --------------------------------------------------

    const pendingStatuses = [
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.OUT_FOR_DELIVERY,
    ];

    const completedStatuses = [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED];

    let allowedStatuses;

    if (status === "pending") {
      allowedStatuses = pendingStatuses;
    } else if (status === "completed") {
      allowedStatuses = completedStatuses;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter. Use pending or completed.",
      });
    }

    // --------------------------------------------------
    // Find orders containing this delivery partner's
    // items with the requested status
    // --------------------------------------------------

    const orders = await Order.find({
      items: {
        $elemMatch: {
          deliveryPartner: deliveryPartner._id,
          orderStatus: {
            $in: allowedStatuses,
          },
        },
      },
    })
      .populate("customer", "name email mobile")
      .populate("items.seller", "shopName")
      .populate("items.product", "productName slug")
      .sort({ createdAt: -1 });

    // --------------------------------------------------
    // Return only this delivery partner's items
    // matching the requested status
    // --------------------------------------------------

    const myOrders = orders
      .map((order) => {
        const myItems = order.items.filter(
          (item) =>
            item.deliveryPartner &&
            item.deliveryPartner.toString() ===
              deliveryPartner._id.toString() &&
            allowedStatuses.includes(item.orderStatus),
        );

        if (myItems.length === 0) {
          return null;
        }

        return {
          _id: order._id,
          orderNumber: order.orderNumber,
          customer: order.customer,
          shippingAddress: order.shippingAddress,
          deliveryContact: order.deliveryContact,
          items: myItems,
          pricing: order.pricing,
          createdAt: order.createdAt,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      status,
      count: myOrders.length,
      orders: myOrders,
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
// Update Delivery Order Item Status
// ======================================================
// Allowed:
//
// confirmed -> outForDelivery
//
// outForDelivery -> delivered
// outForDelivery -> cancelled
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

    const { orderId, itemIndex } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    const index = Number(itemIndex);

    if (!Number.isInteger(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid item index.",
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
    // Find item
    // --------------------------------------------------

    const item = order.items[index];

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found.",
      });
    }

    // --------------------------------------------------
    // Make sure this delivery partner accepted
    // this item
    // --------------------------------------------------

    if (
      !item.deliveryPartner ||
      item.deliveryPartner.toString() !== deliveryPartner._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this delivery item.",
      });
    }

    // --------------------------------------------------
    // Validate status transition
    // --------------------------------------------------

    if (
      item.orderStatus === ORDER_STATUS.CONFIRMED &&
      status !== ORDER_STATUS.OUT_FOR_DELIVERY
    ) {
      return res.status(400).json({
        success: false,
        message: "A confirmed item can only be changed to outForDelivery.",
      });
    }

    if (
      item.orderStatus === ORDER_STATUS.OUT_FOR_DELIVERY &&
      ![ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "An out-for-delivery item can only be delivered or cancelled.",
      });
    }

    // --------------------------------------------------
    // Prevent updating completed/cancelled items
    // --------------------------------------------------

    if (
      item.orderStatus === ORDER_STATUS.DELIVERED ||
      item.orderStatus === ORDER_STATUS.CANCELLED
    ) {
      return res.status(400).json({
        success: false,
        message: `Item is already ${item.orderStatus}.`,
      });
    }

    // --------------------------------------------------
    // Update status
    // --------------------------------------------------

    item.orderStatus = status;

    // --------------------------------------------------
    // If delivered, store delivery time
    // --------------------------------------------------

    if (status === ORDER_STATUS.DELIVERED) {
      item.deliveredAt = new Date();
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Delivery status updated successfully.",
      orderId: order._id,
      orderNumber: order.orderNumber,
      itemIndex: index,
      orderStatus: item.orderStatus,
      deliveredAt: item.deliveredAt,
    });
  } catch (error) {
    console.error("Update Delivery Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update delivery status.",
    });
  }
};
