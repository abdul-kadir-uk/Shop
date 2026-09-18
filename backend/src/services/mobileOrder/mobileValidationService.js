// src/services/mobileOrder/mobileValidationService.js

import mongoose from "mongoose";
import MobileProduct from "../../models/MobileProduct.js";

/* ==========================================================
   Validate Product ID
========================================================== */

export const validateProductId = (productId) => {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid mobile product ID.");
  }
};

/* ==========================================================
   Validate Quantity
========================================================== */

export const validateQuantity = (quantity) => {
  const numericQuantity = Number(quantity);

  if (!Number.isInteger(numericQuantity) || numericQuantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }

  return numericQuantity;
};

/* ==========================================================
   Get Mobile Product
========================================================== */

export const getMobileProduct = async (productId) => {
  validateProductId(productId);

  const product = await MobileProduct.findOne({
    _id: productId,
    isDeleted: false,
    isAvailable: true,
  }).populate({
    path: "sellerId",
  });

  if (!product) {
    throw new Error("Mobile product is unavailable or does not exist.");
  }

  if (!product.sellerId) {
    throw new Error("Seller information is missing for this product.");
  }

  return product;
};
