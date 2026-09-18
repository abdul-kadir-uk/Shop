// controllers/mobileCheckoutController.js

import Customer from "../models/Customer.js";
import City from "../models/City.js";

import {
  buildMobileBuyNowSummary,
  buildMobileCartSummary,
} from "../services/mobileOrder/mobileOrderService.js";

export const getMobileCheckoutSummary = async (req, res) => {
  try {
    const { type, productId, quantity = 1, cityId, color } = req.body;

    if (!type || !["buyNow", "cart"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Checkout type must be either buyNow or cart.",
      });
    }

    // IMPORTANT:
    // req.user is the logged-in User.
    // Customer has its own _id and references User through userId.
    const customer = await Customer.findOne({
      userId: req.user._id,
    }).select("name mobile email address");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // -------------------------------------------------------
    // ACTIVE CITIES
    // -------------------------------------------------------

    const cities = await City.find({
      isActive: true,
    })
      .select("name state deliveryCharge")
      .sort({
        name: 1,
      });

    // -------------------------------------------------------
    // SELECTED CITY
    // -------------------------------------------------------

    // City is NOT required on the first checkout load.
    // The user selects it on the checkout page.
    let selectedCity = null;
    let deliveryCharge = 0;

    if (cityId) {
      selectedCity = await City.findOne({
        _id: cityId,
        isActive: true,
      }).select("name state deliveryCharge");

      if (!selectedCity) {
        return res.status(400).json({
          success: false,
          message: "Selected city is unavailable.",
        });
      }

      deliveryCharge = Number(selectedCity.deliveryCharge) || 0;
    }

    let summary;

    // -------------------------------------------------------
    // BUY NOW
    // -------------------------------------------------------

    if (type === "buyNow") {
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required for Buy Now.",
        });
      }

      summary = await buildMobileBuyNowSummary({
        productId,
        quantity,
        selectedColor: color || "",
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

    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    return res.status(200).json({
      success: true,

      customer,

      selectedCity,

      cities,

      order: {
        items: summary.items,
        unavailableItems: summary.unavailableItems,
        pricing: summary.pricing,
      },

      paymentMethods: ["COD"],
    });
  } catch (error) {
    console.error("Get mobile checkout summary error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to get mobile checkout summary.",
    });
  }
};
