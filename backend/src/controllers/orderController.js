// controllers/orderController.js

import Customer from "../models/Customer.js";
import City from "../models/City.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";

import {
  buildBuyNowSummary,
  buildCartSummary,
} from "../services/order/orderService.js";

import { generateOrderNumber } from "../utils/generateOrderNumber.js";
import {
  notifySellersNewOrder,
  notifyDeliveryPartnersNewOrder,
  notifyAdminNewOrder,
  notifySellersOrderCancelled,
  notifyDeliveryPartnersOrderCancelled,
  notifyAdminOrderCancelled,
} from "../services/telegram/telegramNotificationService.js";

/* ==========================================================
   Place Order
========================================================== */

export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // --------------------------------------------------
    // Only customers
    // --------------------------------------------------

    if (req.user.role !== "customer") {
      await session.abortTransaction();
      session.endSession();

      return res.status(403).json({
        success: false,
        message: "Only customers can place orders.",
      });
    }

    // --------------------------------------------------
    // Customer
    // --------------------------------------------------

    const customer = await Customer.findOne({
      userId: req.user._id,
    }).select("name email mobile address");

    if (!customer) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const {
      type,
      productId,
      variantIndex = -1,
      quantity = 1,
      cityId,
      address,
      alternateMobile,
      paymentMethod,
    } = req.body;

    // --------------------------------------------------
    // Payment
    // --------------------------------------------------

    if (paymentMethod !== "COD") {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    // --------------------------------------------------
    // City
    // --------------------------------------------------

    if (!cityId) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "City is required.",
      });
    }

    const city = await City.findOne({
      _id: cityId,
      isActive: true,
    });

    if (!city) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Selected city not found.",
      });
    }

    // --------------------------------------------------
    // Address
    // --------------------------------------------------

    const shippingAddress = address?.trim() || customer.address?.trim();

    if (!shippingAddress) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Shipping address is required.",
      });
    }

    // --------------------------------------------------
    // Mobile
    // --------------------------------------------------

    const primaryMobile = customer.mobile;
    const secondaryMobile = alternateMobile?.trim() || "";

    // --------------------------------------------------
    // Build Checkout Summary
    // --------------------------------------------------

    let summary;

    if (type === "buyNow") {
      summary = await buildBuyNowSummary({
        productId,
        variantIndex,
        quantity,
      });
    } else if (type === "cart") {
      summary = await buildCartSummary({
        customerId: customer._id,
      });
    } else {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid checkout type.",
      });
    }

    // --------------------------------------------------
    // Generate ONE order number
    // --------------------------------------------------

    const orderNumber = await generateOrderNumber();

    // --------------------------------------------------
    // Prepare ALL items inside ONE order
    // --------------------------------------------------

    const orderItems = summary.items.map((item) => ({
      product: item.product,
      seller: item.seller,

      variantIndex: item.variantIndex,
      quantity: item.quantity,

      productName: item.productName,
      brand: item.brand,
      image: item.image,
      variant: item.variant,

      price: item.price,
      discountPrice: item.discountPrice,

      subtotal: item.subtotal,

      // Each item starts as ordered.
      // Seller can later update this item independently.
      orderStatus: "ordered",

      deliveryPartner: null,
      acceptedAt: null,
      deliveredAt: null,
    }));

    // --------------------------------------------------
    // Create ONE Order
    // --------------------------------------------------

    const [order] = await Order.create(
      [
        {
          customer: customer._id,

          orderNumber,

          items: orderItems,

          shippingAddress: {
            address: shippingAddress,

            city: {
              _id: city._id,
              name: city.name,
              state: city.state,
            },
          },

          deliveryContact: {
            primaryMobile,
            alternateMobile: secondaryMobile,
          },

          pricing: {
            subtotal: summary.pricing.subtotal,
            discount: summary.pricing.discount || 0,
            deliveryCharge: summary.pricing.deliveryCharge || 0,
            total: summary.pricing.total,
          },

          paymentMethod,
          paymentStatus: "pending",

          // Outer order status
          orderStatus: "ordered",
        },
      ],
      { session },
    );

    // --------------------------------------------------
    // Clear cart
    // --------------------------------------------------

    if (type === "cart") {
      await Cart.deleteOne(
        {
          customer: customer._id,
        },
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    // Telegram notifications must NEVER affect order placement.
    notifySellersNewOrder(order).catch((error) => {
      console.error("Seller Telegram Notification Error:", error);
    });

    notifyDeliveryPartnersNewOrder(order).catch((error) => {
      console.error("Delivery Telegram Notification Error:", error);
    });

    notifyAdminNewOrder(order).catch((error) => {
      console.error("Admin Telegram Notification Error:", error);
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",

      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        itemCount: order.items.length,
        pricing: order.pricing,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Place Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to place order.",
    });
  }
};

// cancel order

export const cancelOrder = async (req, res) => {
  try {
    // --------------------------------------------------
    // Only customers
    // --------------------------------------------------

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can cancel orders.",
      });
    }

    // --------------------------------------------------
    // Customer
    // --------------------------------------------------

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // --------------------------------------------------
    // Validate order ID
    // --------------------------------------------------

    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    // --------------------------------------------------
    // Find customer's order
    // --------------------------------------------------

    const order = await Order.findOne({
      _id: orderId,
      customer: customer._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // --------------------------------------------------
    // Already cancelled
    // --------------------------------------------------

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled.",
      });
    }

    // --------------------------------------------------
    // Check every item
    //
    // Customer can cancel the complete order only if
    // every item is still in ordered/confirmed state.
    // --------------------------------------------------

    const nonCancellableItem = order.items.find(
      (item) =>
        !["ordered", "confirmed", "notAvailable"].includes(item.orderStatus),
    );

    if (nonCancellableItem) {
      return res.status(400).json({
        success: false,
        message:
          "Order cannot be cancelled now but dont worry you can refuse delivery at doorStep.",
      });
    }

    // --------------------------------------------------
    // Cancel entire order
    // --------------------------------------------------

    order.orderStatus = "cancelled";

    // Cancel every item
    order.items.forEach((item) => {
      item.orderStatus = "cancelled";
    });

    await order.save();

    // Telegram cancellation notifications must NEVER
    // affect the cancellation operation.

    notifySellersOrderCancelled(order).catch((error) => {
      console.error("Seller Cancellation Telegram Error:", error);
    });

    notifyDeliveryPartnersOrderCancelled(order).catch((error) => {
      console.error("Delivery Partner Cancellation Telegram Error:", error);
    });

    notifyAdminOrderCancelled(order).catch((error) => {
      console.error("Admin Cancellation Telegram Error:", error);
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",

      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        itemCount: order.items.length,
      },
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order.",
    });
  }
};

/* ==========================================================
   Get My Orders
   GET /api/orders/my-orders

   Customer sees ONE order with ALL items.
========================================================== */
export const getMyOrders = async (req, res) => {
  try {
    // --------------------------------------------------
    // Only customers
    // --------------------------------------------------

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can access orders.",
      });
    }

    // --------------------------------------------------
    // Customer
    // --------------------------------------------------

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);

    const skip = (page - 1) * limit;

    // --------------------------------------------------
    // Order-level status
    // --------------------------------------------------

    const status = req.query.status || "";

    const query = {
      customer: customer._id,
    };

    if (status) {
      query.orderStatus = status;
    }

    // --------------------------------------------------
    // Count actual customer orders
    // --------------------------------------------------

    const totalOrders = await Order.countDocuments(query);

    // --------------------------------------------------
    // Fetch orders
    // --------------------------------------------------

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // --------------------------------------------------
    // Return ALL items
    // --------------------------------------------------

    const formattedOrders = orders.map((order) => ({
      _id: order._id,

      orderNumber: order.orderNumber,

      orderStatus: order.orderStatus,

      products: order.items.map((item) => ({
        productId: item.product,

        name: item.productName,

        image: item.image,

        brand: item.brand,

        quantity: item.quantity,

        variant: item.variant,

        price: item.price,

        discountPrice: item.discountPrice,

        subtotal: item.subtotal,

        orderStatus: item.orderStatus,
      })),

      itemCount: order.items.length,

      pricing: order.pricing,

      paymentMethod: order.paymentMethod,

      paymentStatus: order.paymentStatus,

      createdAt: order.createdAt,
    }));

    return res.status(200).json({
      success: true,

      page,

      limit,

      totalOrders,

      totalPages: Math.ceil(totalOrders / limit),

      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders.",
    });
  }
};

/* ==========================================================
   Get Single Order
   GET /api/orders/:orderId

   Returns ALL items in the order.
========================================================== */

export const getSingleOrder = async (req, res) => {
  try {
    // --------------------------------------------------
    // Only customers
    // --------------------------------------------------

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can access orders.",
      });
    }

    // --------------------------------------------------
    // Customer
    // --------------------------------------------------

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // --------------------------------------------------
    // Validate order ID
    // --------------------------------------------------

    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    // --------------------------------------------------
    // Find customer's order
    // --------------------------------------------------

    const order = await Order.findOne({
      _id: orderId,
      customer: customer._id,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,

      order: {
        _id: order._id,

        orderNumber: order.orderNumber,

        createdAt: order.createdAt,

        orderStatus: order.orderStatus,

        products: order.items.map((item) => ({
          productId: item.product,

          name: item.productName,

          brand: item.brand,

          image: item.image,

          quantity: item.quantity,

          variant: item.variant,

          price: item.price,

          discountPrice: item.discountPrice,

          subtotal: item.subtotal,

          orderStatus: item.orderStatus,

          deliveryPartner: item.deliveryPartner,

          acceptedAt: item.acceptedAt,

          deliveredAt: item.deliveredAt,
        })),

        shippingAddress: order.shippingAddress,

        deliveryContact: order.deliveryContact,

        pricing: order.pricing,

        paymentMethod: order.paymentMethod,

        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Get Single Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order.",
    });
  }
};
