// controllers/checkoutController.js
import Customer from "../models/Customer.js";
import City from "../models/City.js";

import {
  buildBuyNowSummary,
  buildCartSummary,
} from "../services/order/orderService.js";

/* ==========================================================
   Minimum Order Value
========================================================== */

const MINIMUM_ORDER_VALUE = 100;

/* ==========================================================
   Checkout Summary
   POST /api/checkout/summary
========================================================== */

export const getCheckoutSummary = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      userId: req.user._id,
    }).select("name email mobile address");

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can checkout.",
      });
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const { type, productId, variantIndex = -1, quantity = 1 } = req.body;

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

    const cities = await City.find({
      isActive: true,
    })
      .select("name state deliveryCharge")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Checkout summary fetched successfully.",

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
    console.error("Checkout Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch checkout summary.",
    });
  }
};
