// src/controllers/medicineOrderController.js

import mongoose from "mongoose";

import Customer from "../models/Customer.js";
import City from "../models/City.js";
import MedicineCart from "../models/MedicineCart.js";
import MedicineOrder from "../models/MedicineOrder.js";

import {
  buildMedicineBuyNowSummary,
  buildMedicineCartSummary,
} from "../services/medicineOrder/medicineOrderService.js";

import { calculateMedicinePromo } from "../services/medicineOrder/medicinePromoService.js";
import { generateMedicineOrderNumber } from "../utils/generateMedicineOrderNumber.js";

import {
  notifySellersNewOrder,
  notifyDeliveryPartnersNewOrder,
  notifyAdminNewOrder,
  notifySellersOrderCancelled,
  notifyDeliveryPartnersOrderCancelled,
  notifyAdminOrderCancelled,
} from "../services/telegram/telegramNotificationService.js";

const MINIMUM_ORDER_VALUE = 100;

const isCustomer = (req) => req.user?.role === "customer";

const sendError = (res, status, message, extra = {}) =>
  res.status(status).json({
    success: false,
    message,
    ...extra,
  });

/* ==========================================================
   Place Medicine Order
   POST /api/medicine-orders
========================================================== */

export const placeMedicineOrder = async (req, res) => {
  let session;
  let transactionStarted = false;

  try {
    if (!isCustomer(req)) {
      return sendError(res, 403, "Only customers can place orders.");
    }

    const customer = await Customer.findOne({
      userId: req.user._id,
    }).select("name email mobile address");

    if (!customer) {
      return sendError(res, 404, "Customer not found.");
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
      promoCode,
    } = req.body;

    // Payment method
    if (paymentMethod !== "COD") {
      return sendError(res, 400, "Invalid payment method.");
    }

    // City
    if (!cityId) {
      return sendError(res, 400, "City is required.");
    }

    if (!mongoose.Types.ObjectId.isValid(cityId)) {
      return sendError(res, 400, "Invalid city id.");
    }

    const city = await City.findOne({
      _id: cityId,
      isActive: true,
    });

    if (!city) {
      return sendError(res, 404, "Selected city not found.");
    }

    // Address
    const shippingAddress =
      typeof address === "string" && address.trim()
        ? address.trim()
        : customer.address?.trim();

    if (!shippingAddress) {
      return sendError(res, 400, "Shipping address is required.");
    }

    if (!customer.mobile) {
      return sendError(
        res,
        400,
        "A primary mobile number is required for delivery.",
      );
    }

    const primaryMobile = customer.mobile;
    const secondaryMobile =
      typeof alternateMobile === "string" ? alternateMobile.trim() : "";

    // Build medicine checkout summary
    let summary;

    if (type === "buyNow") {
      summary = await buildMedicineBuyNowSummary({
        productId,
        variantIndex,
        quantity,
      });
    } else if (type === "cart") {
      summary = await buildMedicineCartSummary({
        customerId: customer._id,
      });
    } else {
      return sendError(res, 400, "Invalid checkout type.");
    }

    if (!summary.items?.length) {
      return sendError(res, 400, "No valid medicines found in your order.");
    }

    if (summary.pricing.subtotal < MINIMUM_ORDER_VALUE) {
      return sendError(
        res,
        400,
        `Minimum order value is ₹${MINIMUM_ORDER_VALUE}. Please add more items to your order.`,
        {
          minimumOrderValue: MINIMUM_ORDER_VALUE,
          currentOrderValue: summary.pricing.subtotal,
        },
      );
    }

    // Medicine promo codes are separate from Grocery promo codes.
    const promo = await calculateMedicinePromo({
      promoCode,
      customerId: customer._id,
      subtotal: summary.pricing.subtotal,
    });

    const finalTotal = Math.max(
      0,
      summary.pricing.total - (promo.promoDiscount || 0),
    );

    // Keep Medicine order creation and Medicine cart clearing atomic.
    session = await mongoose.startSession();
    session.startTransaction();
    transactionStarted = true;

    const orderNumber = await generateMedicineOrderNumber();

    // Match the fields in MedicineOrder.js exactly.
    const orderItems = summary.items.map((item) => ({
      product: item.product,
      seller: item.seller,
      variantIndex: item.variantIndex ?? -1,
      quantity: item.quantity,

      productName: item.productName,
      brand: item.brand || "",
      image: item.image || "",

      composition: item.composition || "",
      strength: item.strength || "",
      dosageForm: item.dosageForm || "",
      packSize: item.packSize || "",
      requiresPrescription: Boolean(item.requiresPrescription),

      variant: {
        quantity: item.variant?.quantity,
        unit: item.variant?.unit || "",
        label: item.variant?.label || "",
      },

      price: item.price,
      discountPrice: item.discountPrice ?? null,
      subtotal: item.subtotal,

      orderStatus: "ordered",
      deliveryPartner: null,
      acceptedAt: null,
      deliveredAt: null,
    }));

    const [order] = await MedicineOrder.create(
      [
        {
          customer: customer._id,
          orderNumber,
          orderStatus: "ordered",
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
            promoCode: promo.promoCode || null,
            promoDiscount: promo.promoDiscount || 0,
            total: finalTotal,
          },

          paymentMethod: "COD",
          paymentStatus: "pending",
        },
      ],
      { session },
    );

    // Clear only the Medicine cart after a cart checkout.
    if (type === "cart") {
      await MedicineCart.deleteOne({ customer: customer._id }, { session });
    }

    await session.commitTransaction();

    notifySellersNewOrder(order).catch((error) => {
      console.error("Medicine Seller Telegram Notification Error:", error);
    });

    notifyDeliveryPartnersNewOrder(order, "medicine").catch((error) => {
      console.error("Medicine Delivery Telegram Notification Error:", error);
    });

    notifyAdminNewOrder(order).catch((error) => {
      console.error("Medicine Admin Telegram Notification Error:", error);
    });

    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Medicine order placed successfully.",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        itemCount: order.items.length,
        pricing: order.pricing,
      },
    });
  } catch (error) {
    if (session && transactionStarted) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Medicine order transaction abort error:", abortError);
      }
    }

    console.error("Place Medicine Order Error:", error);

    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to place medicine order.",
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

/* ==========================================================
   Cancel Medicine Order
   PATCH /api/medicine-orders/:orderId/cancel
========================================================== */

export const cancelMedicineOrder = async (req, res) => {
  try {
    if (!isCustomer(req)) {
      return sendError(res, 403, "Only customers can cancel orders.");
    }

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return sendError(res, 404, "Customer not found.");
    }

    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return sendError(res, 400, "Invalid order id.");
    }

    const order = await MedicineOrder.findOne({
      _id: orderId,
      customer: customer._id,
    });

    if (!order) {
      return sendError(res, 404, "Medicine order not found.");
    }

    if (order.orderStatus === "cancelled") {
      return sendError(res, 400, "Order is already cancelled.");
    }

    // The complete order can be cancelled only if every item
    // is still in a cancellable state.
    const nonCancellableItem = order.items.find(
      (item) =>
        !["ordered", "confirmed", "notAvailable"].includes(item.orderStatus),
    );

    if (nonCancellableItem) {
      return sendError(
        res,
        400,
        "Order cannot be cancelled now. You can refuse delivery at the doorstep.",
      );
    }

    order.orderStatus = "cancelled";

    order.items.forEach((item) => {
      item.orderStatus = "cancelled";
    });

    await order.save();

    notifySellersOrderCancelled(order).catch((error) => {
      console.error("Medicine Seller Cancellation Telegram Error:", error);
    });

    notifyDeliveryPartnersOrderCancelled(order).catch((error) => {
      console.error("Medicine Delivery Cancellation Telegram Error:", error);
    });

    notifyAdminOrderCancelled(order).catch((error) => {
      console.error("Medicine Admin Cancellation Telegram Error:", error);
    });

    return res.status(200).json({
      success: true,
      message: "Medicine order cancelled successfully.",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        itemCount: order.items.length,
      },
    });
  } catch (error) {
    console.error("Cancel Medicine Order Error:", error);

    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to cancel medicine order.",
    );
  }
};

/* ==========================================================
   Get Customer's Medicine Orders
   GET /api/medicine-orders/my-orders?page=1&limit=10&status=ordered
========================================================== */

export const getMyMedicineOrders = async (req, res) => {
  try {
    if (!isCustomer(req)) {
      return sendError(res, 403, "Only customers can access orders.");
    }

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return sendError(res, 404, "Customer not found.");
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100,
    );
    const skip = (page - 1) * limit;

    const status = typeof req.query.status === "string" ? req.query.status : "";

    const validStatuses = [
      "ordered",
      "confirmed",
      "notAvailable",
      "outForDelivery",
      "delivered",
      "cancelled",
    ];

    if (status && !validStatuses.includes(status)) {
      return sendError(res, 400, "Invalid order status.");
    }

    const query = { customer: customer._id };

    if (status) {
      query.orderStatus = status;
    }

    const [orders, totalOrders] = await Promise.all([
      MedicineOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      MedicineOrder.countDocuments(query),
    ]);

    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,

      products: order.items.map((item) => ({
        productId: item.product,
        productName: item.productName,
        brand: item.brand,
        image: item.image,

        composition: item.composition,
        strength: item.strength,
        dosageForm: item.dosageForm,
        packSize: item.packSize,
        requiresPrescription: item.requiresPrescription,

        quantity: item.quantity,
        variantIndex: item.variantIndex,
        variant: item.variant,

        price: item.price,
        discountPrice: item.discountPrice,
        subtotal: item.subtotal,
        orderStatus: item.orderStatus,
      })),

      pricing: order.pricing,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    console.error("Get My Medicine Orders Error:", error);

    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to fetch medicine orders.",
    );
  }
};

/* ==========================================================
   Get Single Medicine Order
   GET /api/medicine-orders/:orderId
========================================================== */

export const getSingleMedicineOrder = async (req, res) => {
  try {
    if (!isCustomer(req)) {
      return sendError(res, 403, "Only customers can access orders.");
    }

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return sendError(res, 404, "Customer not found.");
    }

    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return sendError(res, 400, "Invalid order id.");
    }

    const order = await MedicineOrder.findOne({
      _id: orderId,
      customer: customer._id,
    }).lean();

    if (!order) {
      return sendError(res, 404, "Medicine order not found.");
    }

    return res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,

        products: order.items.map((item) => ({
          productId: item.product,
          seller: item.seller,

          productName: item.productName,
          brand: item.brand,
          image: item.image,

          composition: item.composition,
          strength: item.strength,
          dosageForm: item.dosageForm,
          packSize: item.packSize,
          requiresPrescription: item.requiresPrescription,

          quantity: item.quantity,
          variantIndex: item.variantIndex,
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
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Single Medicine Order Error:", error);

    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to fetch medicine order.",
    );
  }
};
