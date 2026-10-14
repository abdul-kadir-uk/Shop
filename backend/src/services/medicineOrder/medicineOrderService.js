// src/services/medicineOrder/medicineOrderService.js

import MedicineCart from "../../models/MedicineCart.js";

import {
  getMedicineProduct,
  getMedicineVariant,
  validateMedicineQuantity,
} from "./medicineValidationService.js";

import {
  calculateMedicineItemPricing as calculateItemPricing,
  calculateMedicineOrderPricing as calculateOrderPricing,
} from "./medicinePricingService.js";

/* ==========================================================
   Build Checkout Item
========================================================== */

const buildMedicineCheckoutItem = (
  product,
  variant,
  quantity,
  variantIndex = -1,
) => {
  const pricing = calculateItemPricing({
    price: variant.price,
    discountPrice: variant.discountPrice,
    quantity,
  });

  return {
    product: product._id,
    seller: product.sellerId._id,
    quantity,
    variantIndex: Number(variantIndex),

    productName: product.productName,
    brand: product.brand || null,
    manufacturer: product.manufacturer || null,
    image: product.mainImage?.url || null,

    // Medicine-specific details
    composition: product.composition || null,
    strength: product.strength || null,
    dosageForm: product.dosageForm || null,
    packSize: product.packSize || null,
    requiresPrescription: Boolean(product.requiresPrescription),

    variant: {
      quantity: variant.quantity ?? null,
      unit: variant.unit ?? null,
      label: variant.label || null,
    },

    price: pricing.price,
    discountPrice: pricing.discountPrice,
    sellingPrice: pricing.sellingPrice,
    subtotal: pricing.subtotal,
    discount: pricing.discount,
  };
};

/* ==========================================================
   Build Medicine Buy Now Summary
========================================================== */

export const buildMedicineBuyNowSummary = async ({
  productId,
  variantIndex = -1,
  quantity,
  deliveryCharge = 0,
}) => {
  const validatedQuantity = validateMedicineQuantity(quantity);

  const product = await getMedicineProduct(productId);

  const variant = getMedicineVariant(product, variantIndex);

  const item = buildMedicineCheckoutItem(
    product,
    variant,
    validatedQuantity,
    variantIndex,
  );

  const pricing = calculateOrderPricing([item], deliveryCharge);

  return {
    items: [item],
    unavailableItems: [],
    pricing,
  };
};

/* ==========================================================
   Build Medicine Cart Summary
========================================================== */

export const buildMedicineCartSummary = async ({
  customerId,
  deliveryCharge = 0,
}) => {
  const cart = await MedicineCart.findOne({
    customer: customerId,
  }).populate({
    path: "items.product",
    populate: {
      path: "sellerId",
    },
  });

  if (!cart || cart.items.length === 0) {
    const error = new Error("Medicine cart is empty.");
    error.statusCode = 400;
    throw error;
  }

  const items = [];
  const unavailableItems = [];

  for (const cartItem of cart.items) {
    const product = cartItem.product;

    // Product no longer exists
    if (!product) {
      unavailableItems.push({
        reason: "Medicine no longer exists.",
      });

      continue;
    }

    // Medicine unavailable or deleted
    if (
      product.isDeleted ||
      !product.isAvailable ||
      product.status !== "active"
    ) {
      unavailableItems.push({
        product: product._id,
        productName: product.productName,
        reason: "Medicine is unavailable.",
      });

      continue;
    }

    try {
      const quantity = validateMedicineQuantity(cartItem.quantity);

      const variant = getMedicineVariant(product, cartItem.variantIndex ?? -1);

      if (!product.sellerId?._id) {
        throw new Error("Medicine seller is unavailable.");
      }

      const item = buildMedicineCheckoutItem(
        product,
        variant,
        quantity,
        cartItem.variantIndex ?? -1,
      );

      items.push(item);
    } catch (error) {
      unavailableItems.push({
        product: product._id,
        productName: product.productName,
        reason: error.message,
      });
    }
  }

  if (items.length === 0) {
    const error = new Error("No valid medicines found in cart.");
    error.statusCode = 400;
    throw error;
  }

  const pricing = calculateOrderPricing(items, deliveryCharge);

  return {
    items,
    unavailableItems,
    pricing,
  };
};
