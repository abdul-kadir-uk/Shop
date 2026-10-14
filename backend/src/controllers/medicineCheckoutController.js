// src/controllers/medicineCheckoutController.js

import Customer from "../models/Customer.js";
import City from "../models/City.js";

import {
  buildMedicineBuyNowSummary,
  buildMedicineCartSummary,
} from "../services/order/medicineOrderService.js";

/* ==========================================================
   Minimum Order Value
========================================================== */

const MINIMUM_ORDER_VALUE = 100;

/* ==========================================================
   Medicine Checkout Summary
   POST /api/medicine-checkout/summary
========================================================== */

export const getMedicineCheckoutSummary = async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can checkout.",
      });
    }

    const customer = await Customer.findOne({
      userId: req.user._id,
    }).select("name email mobile address");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const { type, productId, variantIndex = -1, quantity = 1 } = req.body;

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
      return res.status(400).json({
        success: false,
        message: "Invalid checkout type.",
      });
    }

    // --------------------------------------------------
    // Minimum Order Value
    // --------------------------------------------------

    if (summary.pricing.subtotal < MINIMUM_ORDER_VALUE) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value is ₹${MINIMUM_ORDER_VALUE}. Please add more items to your order.`,
        minimumOrderValue: MINIMUM_ORDER_VALUE,
        currentOrderValue: summary.pricing.subtotal,
      });
    }

    // --------------------------------------------------
    // Active Delivery Cities
    // --------------------------------------------------

    const cities = await City.find({
      isActive: true,
    })
      .select("name state deliveryCharge")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Medicine checkout summary fetched successfully.",

      data: {
        type,
        customer,
        cities,
        order: summary,

        paymentMethods: [
          {
            value: "COD",
            label: "Cash On Delivery",
          },
        ],
      },
    });
  } catch (error) {
    console.error("Medicine Checkout Summary Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch medicine checkout summary.",
    });
  }
};
