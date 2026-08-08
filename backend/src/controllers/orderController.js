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

/* ==========================================================
   Place Order
   POST /api/orders
========================================================== */

export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Only customers
    if (req.user.role !== "customer") {
      await session.abortTransaction();
      session.endSession();

      return res.status(403).json({
        success: false,
        message: "Only customers can place orders.",
      });
    }

    // Customer
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

    // Payment
    if (paymentMethod !== "COD") {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    // City
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

    // Address
    const shippingAddress = address?.trim() || customer.address?.trim();

    if (!shippingAddress) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Shipping address is required.",
      });
    }

    // Mobile
    const primaryMobile = customer.mobile;

    const secondaryMobile = alternateMobile?.trim() || "";

    // Build Summary
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

    const createdOrders = [];

    // Create one order per product
    for (const item of summary.items) {
      const orderNumber = await generateOrderNumber();

      const [order] = await Order.create(
        [
          {
            customer: customer._id,

            orderNumber,

            items: [
              {
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

                orderStatus: "ordered",
              },
            ],

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
              subtotal: item.subtotal,
              discount: item.discount || 0,
              deliveryCharge: 0,
              total: item.subtotal,
            },

            paymentMethod,
            paymentStatus: "pending",
          },
        ],
        { session },
      );

      createdOrders.push({
        id: order._id,
        orderNumber: order.orderNumber,
      });
    }

    // Clear cart
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

    return res.status(201).json({
      success: true,
      message: "Orders placed successfully.",
      orders: createdOrders,
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

// get my orders

export const getMyOrders = async (req, res) => {
  try {
    // Only customers
    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can access orders.",
      });
    }

    // Customer
    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const status = req.query.status || "";

    const query = {
      customer: customer._id,
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
      const item = order.items[0];

      return {
        _id: order._id,

        orderNumber: order.orderNumber,

        product: {
          name: item.productName,

          image: item.image,

          brand: item.brand,

          quantity: item.quantity,

          variant: item.variant,
        },

        pricing: order.pricing,

        paymentMethod: order.paymentMethod,

        paymentStatus: order.paymentStatus,

        orderStatus: item.orderStatus,

        createdAt: order.createdAt,
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
========================================================== */

export const getSingleOrder = async (req, res) => {
  try {
    // Only customers
    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can access orders.",
      });
    }

    // Customer
    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

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

    const item = order.items[0];

    return res.status(200).json({
      success: true,

      order: {
        _id: order._id,

        orderNumber: order.orderNumber,

        createdAt: order.createdAt,

        product: {
          productId: item.product,

          name: item.productName,

          brand: item.brand,

          image: item.image,

          quantity: item.quantity,

          variant: item.variant,

          price: item.price,

          discountPrice: item.discountPrice,

          subtotal: item.subtotal,
        },

        shippingAddress: order.shippingAddress,

        deliveryContact: order.deliveryContact,

        pricing: order.pricing,

        paymentMethod: order.paymentMethod,

        paymentStatus: order.paymentStatus,

        orderStatus: item.orderStatus,
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

/* ==========================================================
   Cancel Order
   PATCH /api/orders/:orderId/cancel
========================================================== */

export const cancelOrder = async (req, res) => {
  try {
    // Only customers
    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can cancel orders.",
      });
    }

    // Customer
    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

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

    const item = order.items[0];

    // Already cancelled
    if (item.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled.",
      });
    }

    // Cannot cancel after dispatch/delivery
    if (
      ["outForDelivery", "delivered", "notAvailable"].includes(item.orderStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is ${item.orderStatus}.`,
      });
    }

    // Allow only ordered or confirmed
    if (!["ordered", "confirmed"].includes(item.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled.",
      });
    }

    item.orderStatus = "cancelled";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order.",
    });
  }
};
