// controllers/mobileDeliveryOrderController.js

import mongoose from "mongoose";
import MobileOrder from "../models/MobileOrder.js";
import DeliveryPartner from "../models/DeliveryPartner.js";

import { createDeliveryEarning } from "../services/earnings/deliveryEarningService.js";

import {
  ORDER_STATUS,
  DELIVERY_ALLOWED_STATUS,
  PAYMENT_STATUS,
} from "../constants/orderStatus.js";

// ======================================================
// Helper: Check whether item is seller-resolved
// ======================================================
//
// Same logic as grocery delivery.
//
// Seller-resolved statuses:
//
// confirmed
// notAvailable
// cancelled
//
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

const hasDeliverableItems = (items = []) => {
  return items.some((item) => item.orderStatus === ORDER_STATUS.CONFIRMED);
};

// ======================================================
// Get Available Mobile Delivery Orders
// ======================================================
//
// Mobile order is available when:
//
// 1. Delivery partner is assigned "mobiles"
// 2. Order belongs to assigned city
// 3. Parent order is ordered / confirmed
// 4. At least one item has no delivery partner
//
// Seller confirmation is NOT required.
//
// GET /api/delivery/mobile-orders
// ======================================================

export const getAvailableMobileDeliveryOrders = async (req, res) => {
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
    // Check mobile category assignment
    // --------------------------------------------------

    const assignedCategories = deliveryPartner.assignedCategories || [];

    if (!assignedCategories.includes("mobiles")) {
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
    // Find available mobile orders
    // --------------------------------------------------
    //
    // Same availability behavior as grocery.
    //
    // We intentionally DO NOT check item.orderStatus.
    //
    // Seller confirmation is not required to make an
    // order available to the delivery partner.
    // --------------------------------------------------

    const orders = await MobileOrder.find({
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
    console.error("Get Available Mobile Delivery Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available mobile delivery orders.",
    });
  }
};

// ======================================================
// Accept Mobile Delivery Order
// ======================================================
//
// Delivery partner accepts the WHOLE mobile order.
//
// Seller confirmation is NOT required.
//
// Parent order remains:
// ordered
//
// Only deliveryPartner / acceptedAt are assigned.
//
// PATCH
// /api/delivery/mobile-orders/:orderId/accept
// ======================================================

export const acceptMobileDeliveryOrder = async (req, res) => {
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
    // Check mobile category assignment
    // --------------------------------------------------

    if (!(deliveryPartner.assignedCategories || []).includes("mobiles")) {
      return res.status(403).json({
        success: false,
        message: "Mobile delivery is not assigned to you.",
      });
    }

    // --------------------------------------------------
    // Find order
    // --------------------------------------------------

    const order = await MobileOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Mobile order not found.",
      });
    }

    // --------------------------------------------------
    // Check assigned city
    // --------------------------------------------------

    const assignedCities = deliveryPartner.assignedCities || [];

    const orderCityId = order.shippingAddress?.city?._id;

    const cityAssigned = assignedCities.some(
      (cityId) => cityId.toString() === orderCityId?.toString(),
    );

    if (!cityAssigned) {
      return res.status(403).json({
        success: false,
        message: "This order city is not assigned to you.",
      });
    }

    // --------------------------------------------------
    // Atomically claim whole order
    // --------------------------------------------------
    //
    // Same logic as grocery.
    //
    // Require:
    //
    // parent order = ordered / confirmed
    //
    // AND every item is currently unassigned.
    //
    // Item status does NOT matter.
    // --------------------------------------------------

    const result = await MobileOrder.updateOne(
      {
        _id: orderId,

        orderStatus: {
          $in: [ORDER_STATUS.ORDERED, ORDER_STATUS.CONFIRMED],
        },

        "shippingAddress.city._id": {
          $in: assignedCities,
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

    const updatedOrder = await MobileOrder.findById(orderId)
      .populate("customer", "name email mobile")
      .populate("items.seller", "shopName address")
      .populate("items.product", "productName slug")
      .lean();

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Mobile order not found after assignment.",
      });
    }

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Mobile delivery order accepted successfully.",
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
    console.error("Accept Mobile Delivery Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept mobile delivery order.",
    });
  }
};

// ======================================================
// Get My Mobile Delivery Orders
// ======================================================
//
// Returns WHOLE mobile orders accepted by this partner.
//
// GET /api/delivery/mobile-orders/my-orders
// ======================================================

export const getMyMobileDeliveryOrders = async (req, res) => {
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
    // Find orders assigned to this delivery partner
    // --------------------------------------------------

    const orderQuery = {
      orderStatus: orderStatusQuery,

      items: {
        $elemMatch: {
          deliveryPartner: deliveryPartner._id,
        },
      },
    };

    // --------------------------------------------------
    // Find orders
    // --------------------------------------------------

    const orders = await MobileOrder.find(orderQuery)
      .populate("customer", "name email mobile")
      .populate("items.seller", "shopName address")
      .populate("items.product", "productName slug")
      .sort({ createdAt: -1 })
      .lean();

    // --------------------------------------------------
    // Build response
    // --------------------------------------------------

    const myOrders = orders.map((order) => {
      const allItemsResolved = areAllItemsResolved(order.items);

      const orderHasDeliverableItems = hasDeliverableItems(order.items);

      const canStartDelivery =
        order.orderStatus === ORDER_STATUS.CONFIRMED &&
        allItemsResolved &&
        orderHasDeliverableItems;

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

        canStartDelivery,

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
    console.error("Get My Mobile Delivery Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your mobile delivery orders.",
    });
  }
};

// ======================================================
// Update Mobile Delivery Order Status
// ======================================================
//
// Same delivery lifecycle as grocery:
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
//
// PATCH
// /api/delivery/mobile-orders/:orderId/status
// ======================================================

export const updateMobileDeliveryOrderStatus = async (req, res) => {
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

    const order = await MobileOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Mobile order not found.",
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

      return res.status(200).json({
        success: true,
        message: "Mobile order is now out for delivery.",
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
      // Confirmed items become delivered
      //
      // notAvailable stays notAvailable.
      // cancelled stays cancelled.
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
      // Create delivery earning
      // ------------------------------------------------

      await createDeliveryEarning({
        deliveryPartnerId: deliveryPartner._id,
        orderId: order._id,
        completedAt: new Date(),
      });

      // ------------------------------------------------
      // Response
      // ------------------------------------------------

      return res.status(200).json({
        success: true,
        message: "Mobile order delivered successfully.",
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
      // Do NOT overwrite seller item statuses.
      // ------------------------------------------------

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Mobile order cancelled successfully.",
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
    console.error("Update Mobile Delivery Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update mobile delivery status.",
    });
  }
};
