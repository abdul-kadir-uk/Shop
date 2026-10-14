// src/controllers/medicineSellerOrderController.js

import mongoose from "mongoose";

import MedicineOrder from "../models/MedicineOrder.js";
import Seller from "../models/Seller.js";

import {
  ORDER_STATUS,
  SELLER_ALLOWED_STATUS,
} from "../constants/orderStatus.js";

/* ==========================================================
   Seller Medicine Orders
   GET /api/seller/medicine-orders
========================================================== */

export const getSellerMedicineOrders = async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Only sellers can access Medicine orders.",
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

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const status = req.query.status || "";

    const query = {
      items: {
        $elemMatch: {
          seller: seller._id,
        },
      },
    };

    if (status === "ordered") {
      query.items.$elemMatch.orderStatus = ORDER_STATUS.ORDERED;
    }

    if (status === "completed") {
      query.items.$elemMatch.orderStatus = {
        $in: [
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.NOT_AVAILABLE,
          ORDER_STATUS.DELIVERED,
          ORDER_STATUS.CANCELLED,
        ],
      };
    }

    const totalOrders = await MedicineOrder.countDocuments(query);

    const orders = await MedicineOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedOrders = orders.map((order) => {
      const sellerItems = order.items.filter(
        (item) => item.seller?.toString() === seller._id.toString(),
      );

      const sellerTotal = sellerItems.reduce(
        (sum, item) => sum + (Number(item.subtotal) || 0),
        0,
      );

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        sellerTotal,
        totalItems: sellerItems.length,

        items: sellerItems.map((item) => ({
          product: item.product,
          productName: item.productName,
          brand: item.brand,
          image: item.image,

          composition: item.composition,
          strength: item.strength,
          dosageForm: item.dosageForm,
          packSize: item.packSize,
          requiresPrescription: item.requiresPrescription,

          variant: item.variant,
          variantIndex: item.variantIndex,

          quantity: item.quantity,
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
    console.error("Seller Medicine Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller Medicine orders.",
    });
  }
};

/* ==========================================================
   Get Seller Single Medicine Order
   GET /api/seller/medicine-orders/:orderId
========================================================== */

export const getSellerSingleMedicineOrder = async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Only sellers can access Medicine orders.",
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

    const order = await MedicineOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Medicine order not found.",
      });
    }

    const sellerItems = order.items.filter(
      (item) => item.seller?.toString() === seller._id.toString(),
    );

    if (sellerItems.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order.",
      });
    }

    const sellerTotal = sellerItems.reduce(
      (sum, item) => sum + (Number(item.subtotal) || 0),
      0,
    );

    return res.status(200).json({
      success: true,

      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,

        shippingAddress: order.shippingAddress,
        deliveryContact: order.deliveryContact,

        sellerTotal,
        totalItems: sellerItems.length,

        items: sellerItems.map((item) => ({
          product: item.product,
          productName: item.productName,
          brand: item.brand,
          image: item.image,

          composition: item.composition,
          strength: item.strength,
          dosageForm: item.dosageForm,
          packSize: item.packSize,
          requiresPrescription: item.requiresPrescription,

          variant: item.variant,
          variantIndex: item.variantIndex,

          quantity: item.quantity,
          price: item.price,
          discountPrice: item.discountPrice,
          subtotal: item.subtotal,

          orderStatus: item.orderStatus,
        })),
      },
    });
  } catch (error) {
    console.error("Seller Medicine Order Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Medicine order.",
    });
  }
};

/* ==========================================================
   Seller Update Medicine Order Status
   PATCH /api/seller/medicine-orders/:orderId/status
========================================================== */

export const updateSellerMedicineOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Only sellers can update Medicine orders.",
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
    const { itemIndex, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    if (!SELLER_ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Seller can only set confirmed or notAvailable.",
      });
    }

    const order = await MedicineOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Medicine order not found.",
      });
    }

    if (
      order.orderStatus !== ORDER_STATUS.ORDERED &&
      order.orderStatus !== ORDER_STATUS.CONFIRMED
    ) {
      return res.status(400).json({
        success: false,
        message: `This order cannot be updated because it is already ${order.orderStatus}.`,
      });
    }

    const isSingleItemUpdate =
      itemIndex !== undefined && itemIndex !== null && itemIndex !== "";

    const updatedItems = [];

    // ------------------------------------------------------
    // Update one item
    // ------------------------------------------------------

    if (isSingleItemUpdate) {
      const index = Number(itemIndex);

      if (!Number.isInteger(index) || index < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid item index.",
        });
      }

      const item = order.items[index];

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Medicine order item not found.",
        });
      }

      if (item.seller?.toString() !== seller._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this item.",
        });
      }

      if (item.orderStatus !== ORDER_STATUS.ORDERED) {
        return res.status(400).json({
          success: false,
          message: `Item is already ${item.orderStatus}.`,
        });
      }

      item.orderStatus = status;

      updatedItems.push({
        item,
        index,
      });
    } else {
      // ----------------------------------------------------
      // Update all unresolved items belonging to this seller
      // ----------------------------------------------------

      order.items.forEach((item, index) => {
        if (item.seller?.toString() !== seller._id.toString()) {
          return;
        }

        if (item.orderStatus !== ORDER_STATUS.ORDERED) {
          return;
        }

        item.orderStatus = status;

        updatedItems.push({
          item,
          index,
        });
      });

      if (updatedItems.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "There are no pending Medicine items belonging to this seller in this order.",
        });
      }
    }

    // ------------------------------------------------------
    // Resolve parent order status only when all items
    // have been processed by sellers.
    // ------------------------------------------------------

    const allItemsResolved = order.items.every((item) =>
      [
        ORDER_STATUS.CONFIRMED,
        ORDER_STATUS.NOT_AVAILABLE,
        ORDER_STATUS.CANCELLED,
      ].includes(item.orderStatus),
    );

    const hasDeliverableItems = order.items.some(
      (item) => item.orderStatus === ORDER_STATUS.CONFIRMED,
    );

    if (
      allItemsResolved &&
      hasDeliverableItems &&
      order.orderStatus === ORDER_STATUS.ORDERED
    ) {
      order.orderStatus = ORDER_STATUS.CONFIRMED;
    }

    await order.save();

    return res.status(200).json({
      success: true,

      message: isSingleItemUpdate
        ? "Medicine order item status updated successfully."
        : "All pending Medicine items belonging to this seller were updated successfully.",

      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,

        updatedItems: updatedItems.map(({ index, item }) => ({
          itemIndex: index,
          orderStatus: item.orderStatus,
        })),

        updatedCount: updatedItems.length,
        allItemsResolved,
        hasDeliverableItems,
      },
    });
  } catch (error) {
    console.error("Seller Update Medicine Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update Medicine order status.",
    });
  }
};
