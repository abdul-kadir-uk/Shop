// src/services/medicineOrder/medicineValidationService.js

import mongoose from "mongoose";
import MedicineProduct from "../../models/MedicineProduct.js";
import City from "../../models/City.js";

/* ==========================================================
   Validate MongoDB ObjectId
========================================================== */

export const validateObjectId = (id, field = "Id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${field}.`);
    error.statusCode = 400;
    throw error;
  }
};

/* ==========================================================
   Get Medicine Product
========================================================== */

export const getMedicineProduct = async (productId) => {
  validateObjectId(productId, "medicine product id");

  const product = await MedicineProduct.findOne({
    _id: productId,
    isDeleted: false,
    isAvailable: true,
    status: "active",
  }).populate("sellerId");

  if (!product) {
    const error = new Error("Medicine not found or unavailable.");
    error.statusCode = 404;
    throw error;
  }

  return product;
};

/* ==========================================================
   Validate Medicine Variant
========================================================== */

export const getMedicineVariant = (product, variantIndex = -1) => {
  const index = Number(variantIndex);

  // Main medicine product
  if (index === -1) {
    return {
      quantity: product.quantity ?? null,
      unit: product.unit ?? null,
      label:
        product.quantity && product.unit
          ? `${product.quantity} ${product.unit}`
          : product.packSize || product.productName,

      price: product.price,
      discountPrice: product.discountPrice ?? null,
    };
  }

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    !Array.isArray(product.variants) ||
    index >= product.variants.length
  ) {
    const error = new Error("Selected medicine variant not found.");
    error.statusCode = 400;
    throw error;
  }

  return product.variants[index];
};

/* ==========================================================
   Validate Quantity
========================================================== */

export const validateMedicineQuantity = (quantity) => {
  const parsedQuantity = Number(quantity);

  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
    const error = new Error("Quantity must be at least 1.");
    error.statusCode = 400;
    throw error;
  }

  return parsedQuantity;
};

/* ==========================================================
   Get Active City
========================================================== */

export const getMedicineCity = async (cityId) => {
  validateObjectId(cityId, "city");

  const city = await City.findOne({
    _id: cityId,
    isActive: true,
  });

  if (!city) {
    const error = new Error("Selected city is not available.");
    error.statusCode = 400;
    throw error;
  }

  return city;
};
