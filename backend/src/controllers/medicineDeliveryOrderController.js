// controllers/medicineDeliveryOrderController.js
import mongoose from "mongoose";

import MedicineOrder from "../models/MedicineOrder.js";
import DeliveryPartner from "../models/DeliveryPartner.js";

import {
  ORDER_STATUS,
  DELIVERY_ALLOWED_STATUS,
  PAYMENT_STATUS,
} from "../constants/orderStatus.js";

import { createDeliveryEarning } from "../services/earnings/deliveryEarningService.js";

const MEDICINE_CATEGORY = "medicine";

const isItemResolved = (item) =>
  item.orderStatus === ORDER_STATUS.CONFIRMED ||
  item.orderStatus === ORDER_STATUS.NOT_AVAILABLE;

const areAllItemsResolved = (items = []) =>
  items.length > 0 && items.every(isItemResolved);

const hasDeliverableItems = (items = []) =>
  items.some((item) => item.orderStatus === ORDER_STATUS.CONFIRMED);

const isMedicineCategoryAssigned = (partner) =>
  partner?.assignedCategories?.includes(MEDICINE_CATEGORY);

const getAssignedCityIds = (partner) =>
  (partner?.assignedCities || []).map((city) => String(city?._id || city));

const medicineOrderPopulate = [
  {
    path: "customer",
    select: "name email mobile phone",
  },
  {
    path: "items.seller",
    select: "shopName name phone",
  },
  {
    path: "items.product",
    select:
      "productName slug brand composition strength dosageForm packSize mainImage",
  },
];

const populateMedicineOrder = (query) => {
  let populatedQuery = query;

  for (const populateOption of medicineOrderPopulate) {
    populatedQuery = populatedQuery.populate(populateOption);
  }

  return populatedQuery;
};

const getPagination = (req) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

/**
 * GET /api/delivery/medicine-orders/available
 *
 * Get available Medicine orders for the delivery partner's assigned cities.
 */
export const getAvailableMedicineDeliveryOrders = async (req, res) => {
  try {
    if (req.user?.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Only delivery partners can access these orders.",
      });
    }

    const partner = await DeliveryPartner.findOne({
      userId: req.user._id,
    }).lean();

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner profile not found.",
      });
    }

    if (!isMedicineCategoryAssigned(partner)) {
      return res.status(403).json({
        success: false,
        message: "Medicine delivery is not assigned to you.",
      });
    }

    const assignedCityIds = getAssignedCityIds(partner);

    if (!assignedCityIds.length) {
      return res.status(200).json({
        success: true,
        orders: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    }

    const { page, limit, skip } = getPagination(req);

    const filter = {
      orderStatus: {
        $in: [ORDER_STATUS.ORDERED, ORDER_STATUS.CONFIRMED],
      },
      "shippingAddress.city._id": {
        $in: assignedCityIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
      items: {
        $elemMatch: {
          deliveryPartner: null,
        },
      },
      $nor: [
        {
          items: {
            $elemMatch: {
              deliveryPartner: { $ne: null },
            },
          },
        },
      ],
    };

    const [orders, total] = await Promise.all([
      populateMedicineOrder(
        MedicineOrder.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
      ).lean(),
      MedicineOrder.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      orders: orders.map((order) => ({
        ...order,
        category: MEDICINE_CATEGORY,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get available Medicine delivery orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available Medicine orders.",
    });
  }
};

/**
 * POST /api/delivery/medicine-orders/:orderId/accept
 *
 * Accept a Medicine order.
 */
export const acceptMedicineDeliveryOrder = async (req, res) => {
  try {
    if (req.user?.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Only delivery partners can accept orders.",
      });
    }

    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const partner = await DeliveryPartner.findOne({
      userId: req.user._id,
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner profile not found.",
      });
    }

    if (!isMedicineCategoryAssigned(partner)) {
      return res.status(403).json({
        success: false,
        message: "Medicine delivery is not assigned to you.",
      });
    }

    const assignedCityIds = getAssignedCityIds(partner);

    if (!assignedCityIds.length) {
      return res.status(403).json({
        success: false,
        message: "No delivery cities are assigned to you.",
      });
    }

    const result = await MedicineOrder.updateOne(
      {
        _id: orderId,
        orderStatus: {
          $in: [ORDER_STATUS.ORDERED, ORDER_STATUS.CONFIRMED],
        },
        "shippingAddress.city._id": {
          $in: assignedCityIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
        items: {
          $elemMatch: {
            deliveryPartner: null,
          },
        },
        $nor: [
          {
            items: {
              $elemMatch: {
                deliveryPartner: { $ne: null },
              },
            },
          },
        ],
      },
      {
        $set: {
          "items.$[].deliveryPartner": partner._id,
          "items.$[].acceptedAt": new Date(),
        },
      },
    );

    if (!result.modifiedCount) {
      return res.status(409).json({
        success: false,
        message:
          "This Medicine order is no longer available or is outside your assigned cities.",
      });
    }

    const order = await populateMedicineOrder(
      MedicineOrder.findById(orderId),
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Medicine delivery order accepted successfully.",
      order: {
        ...order,
        category: MEDICINE_CATEGORY,
      },
    });
  } catch (error) {
    console.error("Accept Medicine delivery order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept Medicine delivery order.",
    });
  }
};

/**
 * GET /api/delivery/medicine-orders/my-orders?status=pending
 *
 * Get Medicine orders assigned to the current delivery partner.
 * status can be pending or completed.
 */
export const getMyMedicineDeliveryOrders = async (req, res) => {
  try {
    if (req.user?.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Only delivery partners can access their orders.",
      });
    }

    const partner = await DeliveryPartner.findOne({
      userId: req.user._id,
    }).lean();

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner profile not found.",
      });
    }

    if (!isMedicineCategoryAssigned(partner)) {
      return res.status(403).json({
        success: false,
        message: "Medicine delivery is not assigned to you.",
      });
    }

    const status = String(req.query.status || "pending").toLowerCase();

    if (!["pending", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be pending or completed.",
      });
    }

    const { page, limit, skip } = getPagination(req);

    const parentStatuses =
      status === "completed"
        ? [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED]
        : [
            ORDER_STATUS.ORDERED,
            ORDER_STATUS.CONFIRMED,
            ORDER_STATUS.OUT_FOR_DELIVERY,
          ];

    const filter = {
      orderStatus: { $in: parentStatuses },
      items: {
        $elemMatch: {
          deliveryPartner: partner._id,
        },
      },
    };

    const [orders, total] = await Promise.all([
      populateMedicineOrder(
        MedicineOrder.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
      ).lean(),
      MedicineOrder.countDocuments(filter),
    ]);

    const formattedOrders = orders.map((order) => {
      const partnerItems = (order.items || []).filter(
        (item) =>
          String(item.deliveryPartner?._id || item.deliveryPartner) ===
          String(partner._id),
      );

      return {
        ...order,
        items: partnerItems,
        category: MEDICINE_CATEGORY,
        canStartDelivery:
          order.orderStatus === ORDER_STATUS.CONFIRMED &&
          areAllItemsResolved(partnerItems) &&
          hasDeliverableItems(partnerItems),
      };
    });

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get my Medicine delivery orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your Medicine delivery orders.",
    });
  }
};

/**
 * PATCH /api/delivery/medicine-orders/:orderId/status
 *
 * Body: { "status": "outForDelivery" | "delivered" | "cancelled" }
 */
export const updateMedicineDeliveryOrderStatus = async (req, res) => {
  try {
    if (req.user?.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Only delivery partners can update delivery status.",
      });
    }

    const { orderId } = req.params;
    const { status: newStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (!DELIVERY_ALLOWED_STATUS.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status.",
      });
    }

    const partner = await DeliveryPartner.findOne({
      userId: req.user._id,
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner profile not found.",
      });
    }

    if (!isMedicineCategoryAssigned(partner)) {
      return res.status(403).json({
        success: false,
        message: "Medicine delivery is not assigned to you.",
      });
    }

    const order = await MedicineOrder.findOne({
      _id: orderId,
      "items.deliveryPartner": partner._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Medicine order not found or it is not assigned to you.",
      });
    }

    if (newStatus === ORDER_STATUS.OUT_FOR_DELIVERY) {
      if (order.orderStatus !== ORDER_STATUS.CONFIRMED) {
        return res.status(400).json({
          success: false,
          message: "Only confirmed orders can be marked out for delivery.",
        });
      }

      const partnerItems = order.items.filter(
        (item) => String(item.deliveryPartner) === String(partner._id),
      );

      if (
        !areAllItemsResolved(partnerItems) ||
        !hasDeliverableItems(partnerItems)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The order must be fully resolved by sellers and contain at least one confirmed item.",
        });
      }

      order.orderStatus = ORDER_STATUS.OUT_FOR_DELIVERY;
      await order.save();
    } else if (newStatus === ORDER_STATUS.DELIVERED) {
      if (order.orderStatus !== ORDER_STATUS.OUT_FOR_DELIVERY) {
        return res.status(400).json({
          success: false,
          message: "Only orders out for delivery can be marked delivered.",
        });
      }

      const deliveredAt = new Date();

      order.orderStatus = ORDER_STATUS.DELIVERED;

      for (const item of order.items) {
        if (
          String(item.deliveryPartner) === String(partner._id) &&
          item.orderStatus === ORDER_STATUS.CONFIRMED
        ) {
          item.orderStatus = ORDER_STATUS.DELIVERED;
          item.deliveredAt = deliveredAt;
        }
      }

      order.paymentStatus = PAYMENT_STATUS.PAID;

      await order.save();

      // IMPORTANT:
      // Confirm that createDeliveryEarning supports MedicineOrder IDs.
      // If the earning service assumes every order belongs to the
      // Grocery Order model, update that service before enabling this.
      await createDeliveryEarning({
        deliveryPartnerId: partner._id,
        orderId: order._id,
        completedAt: deliveredAt,
      });
    } else if (newStatus === ORDER_STATUS.CANCELLED) {
      if (
        order.orderStatus === ORDER_STATUS.DELIVERED ||
        order.orderStatus === ORDER_STATUS.CANCELLED
      ) {
        return res.status(400).json({
          success: false,
          message: "This order has already been delivered or cancelled.",
        });
      }

      order.orderStatus = ORDER_STATUS.CANCELLED;
      await order.save();
    }

    const updatedOrder = await populateMedicineOrder(
      MedicineOrder.findById(order._id),
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Medicine delivery status updated successfully.",
      order: {
        ...updatedOrder,
        category: MEDICINE_CATEGORY,
      },
    });
  } catch (error) {
    console.error("Update Medicine delivery order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update Medicine delivery status.",
    });
  }
};
