// controllers/mobileOrderController.js

import mongoose from "mongoose";

import Customer from "../models/Customer.js";
import City from "../models/City.js";
import MobileOrder from "../models/MobileOrder.js";
import MobileCart from "../models/MobileCart.js";

import {
  buildMobileBuyNowSummary,
  buildMobileCartSummary,
} from "../services/mobileOrder/mobileOrderService.js";

import {
  notifySellersNewOrder,
  notifyDeliveryPartnersNewOrder,
  notifyAdminNewOrder,
} from "../services/telegram/telegramNotificationService.js";

// ---------------------------------------------------------
// GENERATE MOBILE ORDER NUMBER
// ---------------------------------------------------------
const generateMobileOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);

  return `MOB-${timestamp}-${random}`;
};

// ---------------------------------------------------------
// CREATE MOBILE ORDER
// ---------------------------------------------------------
export const createMobileOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      type,
      productId,
      quantity = 1,
      cityId,
      address,
      primaryMobile,
      alternateMobile = "",
      paymentMethod = "COD",
    } = req.body;

    if (!type || !["buyNow", "cart"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Order type must be either buyNow or cart.",
      });
    }

    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: "City ID is required.",
      });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required.",
      });
    }

    if (!primaryMobile || !primaryMobile.trim()) {
      return res.status(400).json({
        success: false,
        message: "Primary mobile number is required.",
      });
    }

    if (paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Only COD payment is available.",
      });
    }

    // -------------------------------------------------------
    // FIND CUSTOMER FROM LOGGED-IN USER
    // -------------------------------------------------------
    // IMPORTANT:
    // req.user is User.
    // Customer has a separate _id and stores User._id in userId.
    const customer = await Customer.findOne({
      userId: req.user._id,
    }).select("name email mobile");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // -------------------------------------------------------
    // FIND ACTIVE CITY
    // -------------------------------------------------------
    const selectedCity = await City.findOne({
      _id: cityId,
      isActive: true,
    }).select("name state deliveryCharge");

    if (!selectedCity) {
      return res.status(400).json({
        success: false,
        message: "Selected city is unavailable.",
      });
    }

    const deliveryCharge = Number(selectedCity.deliveryCharge) || 0;

    // -------------------------------------------------------
    // START TRANSACTION
    // -------------------------------------------------------
    session.startTransaction();

    let summary;

    // -------------------------------------------------------
    // BUY NOW
    // -------------------------------------------------------
    if (type === "buyNow") {
      if (!productId) {
        throw new Error("Product ID is required for Buy Now.");
      }

      summary = await buildMobileBuyNowSummary({
        productId,
        quantity,
        deliveryCharge,
      });
    }

    // -------------------------------------------------------
    // CART
    // -------------------------------------------------------
    if (type === "cart") {
      summary = await buildMobileCartSummary({
        customerId: customer._id,
        deliveryCharge,
      });
    }

    if (!summary || !summary.items?.length) {
      throw new Error("No valid mobile products found for this order.");
    }

    // -------------------------------------------------------
    // CREATE ORDER ITEMS
    // -------------------------------------------------------
    const orderItems = summary.items.map((item) => ({
      product: item.product,
      seller: item.seller,

      quantity: item.quantity,

      productName: item.productName,
      brand: item.brand || "",
      image: item.image || "",

      variant: {
        variantGroupId: item.variant?.variantGroupId || "",

        variantName: item.variant?.variantName || "",

        ram: item.variant?.ram || "",

        storage: item.variant?.storage || "",
      },

      // -----------------------------------------------------
      // COLOR
      // -----------------------------------------------------
      color: item.color || "",
      colorPrice:
        item.colorPrice !== null && item.colorPrice !== undefined
          ? item.colorPrice
          : null,

      // -----------------------------------------------------
      // PRICING
      // -----------------------------------------------------
      price: item.price,

      discountPrice: item.discountPrice ?? null,

      subtotal: item.subtotal,

      orderStatus: "ordered",

      deliveryPartner: null,

      acceptedAt: null,

      deliveredAt: null,
    }));

    // -------------------------------------------------------
    // CREATE MOBILE ORDER
    // -------------------------------------------------------
    const order = new MobileOrder({
      orderNumber: generateMobileOrderNumber(),

      customer: customer._id,

      orderStatus: "ordered",

      items: orderItems,

      shippingAddress: {
        address: address.trim(),

        city: {
          _id: selectedCity._id,
          name: selectedCity.name,
          state: selectedCity.state,
        },
      },

      deliveryContact: {
        primaryMobile: primaryMobile.trim(),
        alternateMobile: alternateMobile?.trim() || "",
      },

      pricing: {
        subtotal: summary.pricing.subtotal,

        discount: summary.pricing.discount,

        deliveryCharge: summary.pricing.deliveryCharge,

        total: summary.pricing.total,
      },

      paymentMethod: "COD",

      paymentStatus: "pending",
    });

    await order.save({
      session,
    });

    // -------------------------------------------------------
    // CLEAR MOBILE CART
    // -------------------------------------------------------
    // Only Cart checkout clears the mobile cart.
    // Buy Now does not touch the cart.
    if (type === "cart") {
      await MobileCart.updateOne(
        {
          customer: customer._id,
        },
        {
          $set: {
            items: [],
          },
        },
        {
          session,
        },
      );
    }

    // -------------------------------------------------------
    // COMMIT TRANSACTION
    // -------------------------------------------------------
    await session.commitTransaction();

    // Telegram notifications must NEVER affect order placement.
    notifySellersNewOrder(order).catch((error) => {
      console.error("Mobile Seller Telegram Notification Error:", error);
    });

    notifyDeliveryPartnersNewOrder(order, "mobiles").catch((error) => {
      console.error("Mobile Delivery Telegram Notification Error:", error);
    });

    notifyAdminNewOrder(order).catch((error) => {
      console.error("Mobile Admin Telegram Notification Error:", error);
    });

    return res.status(201).json({
      success: true,
      message: "Mobile order placed successfully.",

      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,

        items: order.items,

        shippingAddress: order.shippingAddress,

        deliveryContact: order.deliveryContact,

        pricing: order.pricing,

        paymentMethod: order.paymentMethod,

        paymentStatus: order.paymentStatus,

        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Create mobile order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create mobile order.",
    });
  } finally {
    await session.endSession();
  }
};

// ---------------------------------------------------------
// GET MY MOBILE ORDERS
// ---------------------------------------------------------
export const getMyMobileOrders = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const orders = await MobileOrder.find({
      customer: customer._id,
    })
      .populate({
        path: "items.product",
        select:
          "productName slug brand mainImage variantGroupId variantName ram storage",
      })
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get my mobile orders error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to get mobile orders.",
    });
  }
};

// ---------------------------------------------------------
// GET SINGLE MOBILE ORDER
// ---------------------------------------------------------
export const getSingleMobileOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const order = await MobileOrder.findOne({
      _id: id,
      customer: customer._id,
    }).populate({
      path: "items.product",
      select:
        "productName slug brand mainImage variantGroupId variantName ram storage",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Mobile order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get single mobile order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to get mobile order.",
    });
  }
};

// ---------------------------------------------------------
// CANCEL MOBILE ORDER
// ---------------------------------------------------------
export const cancelMobileOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const order = await MobileOrder.findOne({
      _id: id,
      customer: customer._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Mobile order not found.",
      });
    }

    if (order.orderStatus === "delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivered orders cannot be cancelled.",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Mobile order is already cancelled.",
      });
    }

    order.orderStatus = "cancelled";

    order.items.forEach((item) => {
      if (item.orderStatus !== "delivered") {
        item.orderStatus = "cancelled";
      }
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Mobile order cancelled successfully.",
      order,
    });
  } catch (error) {
    console.error("Cancel mobile order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel mobile order.",
    });
  }
};
