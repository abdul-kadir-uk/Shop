// controllers/deliveryOrderController.js

import mongoose from "mongoose";

import Order from "../models/Order.js";
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
// Helper: Empty response
// ======================================================

const emptyOrdersResponse = (res) => {
  return res.status(200).json({
    success: true,
    count: 0,
    totalOrders: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
    orders: [],
  });
};

// ======================================================
// Get Available Delivery Orders
// ======================================================
//
// Supports:
//
// groceries -> Order model
// mobiles   -> MobileOrder model
//
// Delivery partner must have:
// 1. Assigned category
// 2. Assigned city
//
// Example:
//
// assignedCategories = ["groceries"]
// -> only grocery orders
//
// assignedCategories = ["mobiles"]
// -> only mobile orders
//
// assignedCategories = ["groceries", "mobiles"]
// -> grocery + mobile orders
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
    // Assigned categories
    // --------------------------------------------------

    const assignedCategories = deliveryPartner.assignedCategories || [];

    const canDeliverGroceries = assignedCategories.includes("groceries");

    const canDeliverMobiles = assignedCategories.includes("mobiles");

    // No category assigned
    if (!canDeliverGroceries && !canDeliverMobiles) {
      return emptyOrdersResponse(res);
    }

    // --------------------------------------------------
    // Assigned cities
    // --------------------------------------------------

    const assignedCities = deliveryPartner.assignedCities || [];

    if (assignedCities.length === 0) {
      return emptyOrdersResponse(res);
    }

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    // --------------------------------------------------
    // Common query
    // --------------------------------------------------

    const orderQuery = {
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
    };

    // --------------------------------------------------
    // Fetch Grocery + Mobile orders
    // --------------------------------------------------

    const promises = [];

    if (canDeliverGroceries) {
      promises.push(
        Order.find(orderQuery)
          .populate("customer", "name email mobile")
          .populate("items.seller", "shopName address")
          .populate("items.product", "productName slug")
          .sort({ createdAt: -1 })
          .lean()
          .then((orders) =>
            orders.map((order) => ({
              ...order,
              category: "groceries",
            })),
          ),
      );
    }

    if (canDeliverMobiles) {
      promises.push(
        MobileOrder.find(orderQuery)
          .populate("customer", "name email mobile")
          .populate("items.seller", "shopName address")
          .populate("items.product", "productName slug")
          .sort({ createdAt: -1 })
          .lean()
          .then((orders) =>
            orders.map((order) => ({
              ...order,
              category: "mobiles",
            })),
          ),
      );
    }

    const results = await Promise.all(promises);

    // --------------------------------------------------
    // Merge all categories
    // --------------------------------------------------

    const orders = results
      .flat()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const totalOrders = orders.length;
    const totalPages = Math.ceil(totalOrders / limit);

    const paginatedOrders = orders.slice(skip, skip + limit);

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

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
// Works with both:
//
// groceries -> Order
// mobiles   -> MobileOrder
//
// The category is detected from the order collection.
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

    const assignedCategories = deliveryPartner.assignedCategories || [];

    const assignedCities = deliveryPartner.assignedCities || [];

    if (assignedCities.length === 0) {
      return res.status(403).json({
        success: false,
        message: "No delivery city is assigned to you.",
      });
    }

    // --------------------------------------------------
    // Try Grocery Order
    // --------------------------------------------------

    if (assignedCategories.includes("groceries")) {
      const result = await Order.updateOne(
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

      if (result.modifiedCount > 0) {
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
            category: "groceries",
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
      }
    }

    // --------------------------------------------------
    // Try Mobile Order
    // --------------------------------------------------

    if (assignedCategories.includes("mobiles")) {
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

      if (result.modifiedCount > 0) {
        const updatedOrder = await MobileOrder.findById(orderId)
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
            category: "mobiles",
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
      }
    }

    // --------------------------------------------------
    // Not available
    // --------------------------------------------------

    return res.status(409).json({
      success: false,
      message:
        "This order is no longer available. It may have already been accepted by another delivery partner, or the order city/category is not assigned to you.",
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
// Returns orders already accepted by this delivery partner.
//
// Supports:
// groceries + mobiles
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

    if (status !== "pending" && status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter. Use pending or completed.",
      });
    }

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
    } else {
      orderStatusQuery = {
        $in: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
      };
    }

    const orderQuery = {
      orderStatus: orderStatusQuery,

      items: {
        $elemMatch: {
          deliveryPartner: deliveryPartner._id,
        },
      },
    };

    // --------------------------------------------------
    // Fetch Grocery Orders
    // --------------------------------------------------

    const promises = [];

    if ((deliveryPartner.assignedCategories || []).includes("groceries")) {
      promises.push(
        Order.find(orderQuery)
          .populate("customer", "name email mobile")
          .populate("items.seller", "shopName address")
          .populate("items.product", "productName slug")
          .sort({ createdAt: -1 })
          .lean()
          .then((orders) =>
            orders.map((order) => ({
              ...order,
              category: "groceries",
            })),
          ),
      );
    }

    // --------------------------------------------------
    // Fetch Mobile Orders
    // --------------------------------------------------

    if ((deliveryPartner.assignedCategories || []).includes("mobiles")) {
      promises.push(
        MobileOrder.find(orderQuery)
          .populate("customer", "name email mobile")
          .populate("items.seller", "shopName address")
          .populate("items.product", "productName slug")
          .sort({ createdAt: -1 })
          .lean()
          .then((orders) =>
            orders.map((order) => ({
              ...order,
              category: "mobiles",
            })),
          ),
      );
    }

    const results = await Promise.all(promises);

    // --------------------------------------------------
    // Merge orders
    // --------------------------------------------------

    const orders = results
      .flat()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

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

        category: order.category,

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
// Supports:
// groceries -> Order
// mobiles   -> MobileOrder
//
// Status flow remains unchanged.
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
    // Validate status
    // --------------------------------------------------

    if (!DELIVERY_ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status.",
      });
    }

    // --------------------------------------------------
    // Find the order
    //
    // First check grocery if assigned.
    // Then check mobile if assigned.
    // --------------------------------------------------

    let order = null;
    let orderModel = null;
    let category = null;

    const assignedCategories = deliveryPartner.assignedCategories || [];

    if (assignedCategories.includes("groceries")) {
      order = await Order.findOne({
        _id: orderId,
        items: {
          $elemMatch: {
            deliveryPartner: deliveryPartner._id,
          },
        },
      });

      if (order) {
        orderModel = Order;
        category = "groceries";
      }
    }

    if (!order && assignedCategories.includes("mobiles")) {
      order = await MobileOrder.findOne({
        _id: orderId,
        items: {
          $elemMatch: {
            deliveryPartner: deliveryPartner._id,
          },
        },
      });

      if (order) {
        orderModel = MobileOrder;
        category = "mobiles";
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you are not assigned to this order.",
      });
    }

    // --------------------------------------------------
    // START DELIVERY
    // --------------------------------------------------

    if (status === ORDER_STATUS.OUT_FOR_DELIVERY) {
      // Parent order must be confirmed

      if (order.orderStatus !== ORDER_STATUS.CONFIRMED) {
        return res.status(400).json({
          success: false,
          message: `Order cannot be started because it is already ${order.orderStatus}.`,
        });
      }

      // All items must be resolved

      const allItemsResolved = areAllItemsResolved(order.items);

      if (!allItemsResolved) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery cannot start until all order items are resolved by sellers.",
        });
      }

      // At least one confirmed item

      const orderHasDeliverableItems = hasDeliverableItems(order.items);

      if (!orderHasDeliverableItems) {
        return res.status(400).json({
          success: false,
          message: "This order has no available items to deliver.",
        });
      }

      // Change parent order status

      order.orderStatus = ORDER_STATUS.OUT_FOR_DELIVERY;

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Order is now out for delivery.",
        orderId: order._id,
        orderNumber: order.orderNumber,
        category,
        orderStatus: order.orderStatus,
      });
    }

    // --------------------------------------------------
    // DELIVERED
    // --------------------------------------------------

    if (status === ORDER_STATUS.DELIVERED) {
      if (order.orderStatus !== ORDER_STATUS.OUT_FOR_DELIVERY) {
        return res.status(400).json({
          success: false,
          message: "Only an out-for-delivery order can be marked as delivered.",
        });
      }

      // Update parent order

      order.orderStatus = ORDER_STATUS.DELIVERED;

      // Confirmed items become delivered

      for (const item of order.items) {
        if (item.orderStatus === ORDER_STATUS.CONFIRMED) {
          item.orderStatus = ORDER_STATUS.DELIVERED;

          item.deliveredAt = new Date();
        }
      }

      // COD payment becomes paid

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

      return res.status(200).json({
        success: true,
        message: "Order delivered successfully.",
        orderId: order._id,
        orderNumber: order.orderNumber,
        category,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      });
    }

    // --------------------------------------------------
    // CANCELLED
    // --------------------------------------------------

    if (status === ORDER_STATUS.CANCELLED) {
      if (
        order.orderStatus === ORDER_STATUS.DELIVERED ||
        order.orderStatus === ORDER_STATUS.CANCELLED
      ) {
        return res.status(400).json({
          success: false,
          message: `Order is already ${order.orderStatus}.`,
        });
      }

      // Cancel whole order

      order.orderStatus = ORDER_STATUS.CANCELLED;

      // Do NOT overwrite seller item statuses.

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Order cancelled successfully.",
        orderId: order._id,
        orderNumber: order.orderNumber,
        category,
        orderStatus: order.orderStatus,
      });
    }

    // --------------------------------------------------
    // Unsupported
    // --------------------------------------------------

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
