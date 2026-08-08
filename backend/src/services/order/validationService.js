// src/services/order/validationService.js

import mongoose from "mongoose";
import GroceryProduct from "../../models/GroceryProduct.js";
import City from "../../models/City.js";

/* ==========================================================
   Validate MongoDB ObjectId
========================================================== */

export const validateObjectId = (id, field = "Id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${field}.`);
  }
};

/* ==========================================================
   Get Product
========================================================== */

export const getProduct = async (productId) => {
  validateObjectId(productId, "product id");

  const product = await GroceryProduct.findOne({
    _id: productId,
    isDeleted: false,
    isAvailable: true,
  }).populate("sellerId");

  if (!product) {
    throw new Error("Product not found.");
  }

  return product;
};

/* ==========================================================
   Validate Variant
========================================================== */

export const getVariant = (product, variantIndex = -1) => {
  // Main Product
  if (variantIndex === -1) {
    return {
      quantity: product.quantity,
      unit: product.unit,
      label: `${product.quantity} ${product.unit}`,

      price: product.price,
      discountPrice: product.discountPrice,
    };
  }

  if (
    !Array.isArray(product.variants) ||
    variantIndex < 0 ||
    variantIndex >= product.variants.length
  ) {
    throw new Error("Selected variant not found.");
  }

  return product.variants[variantIndex];
};

/* ==========================================================
   Validate Quantity
========================================================== */

export const validateQuantity = (quantity) => {
  if (!quantity || quantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }
};

/* ==========================================================
   Get City
========================================================== */

export const getCity = async (cityId) => {
  validateObjectId(cityId, "city");

  const city = await City.findOne({
    _id: cityId,
    isActive: true,
  });

  if (!city) {
    throw new Error("Selected city is not available.");
  }

  return city;
};
