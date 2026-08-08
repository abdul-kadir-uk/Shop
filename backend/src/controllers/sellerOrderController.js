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
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Only sellers can access orders.",
      });
    }

    const seller = await Seller.findOne({
      userId: req.user._id,
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const status = req.query.status || "";

    const query = {
      "items.seller": seller._id,
    };

    if (status) {
      query["items.orderStatus"] = status;
    }

    const totalOrders = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Only sellers can access orders.",
      });
    }

    const seller = await Seller.findOne({
      userId: req.user._id,
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    const order = await Order.findById(orderId).select(
      "orderNumber orderStatus paymentStatus createdAt items",
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const sellerItems = order.items.filter(
      (item) => item.seller.toString() === seller._id.toString(),
    );

    if (sellerItems.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order.",
      });
    }

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

export const updateSellerOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Only sellers can update orders.",
      });
    }

    const seller = await Seller.findOne({
      userId: req.user._id,
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    if (!SELLER_ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status.",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const hasSellerItem = order.items.some(
      (item) => item.seller.toString() === seller._id.toString(),
    );

    if (!hasSellerItem) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    // Only ordered -> confirmed / notAvailable
    const sellerItems = order.items.filter(
      (item) => item.seller.toString() === seller._id.toString(),
    );

    for (const item of sellerItems) {
      if (item.orderStatus !== ORDER_STATUS.ORDERED) {
        return res.status(400).json({
          success: false,
          message: `Item is already ${item.orderStatus}.`,
        });
      }
    }

    sellerItems.forEach((item) => {
      item.orderStatus = status;
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    console.error("Seller Update Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  }
};
