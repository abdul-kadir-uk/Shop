// src/services/order/orderService.js

import Cart from "../../models/Cart.js";

import {
  getProduct,
  getVariant,
  validateQuantity,
} from "./validationService.js";

import {
  calculateItemPricing,
  calculateOrderPricing,
} from "./pricingService.js";

/* ==========================================================
   Build Checkout Item
========================================================== */

const buildCheckoutItem = (product, variant, quantity, variantIndex = -1) => {
  const pricing = calculateItemPricing({
    price: variant.price,
    discountPrice: variant.discountPrice,
    quantity,
  });

  return {
    product: product._id,

    seller: product.sellerId._id,

    quantity,

    variantIndex,

    productName: product.productName,

    brand: product.brand,

    image: product.mainImage.url,

    variant: {
      quantity: variant.quantity,
      unit: variant.unit,
      label: variant.label,
    },

    price: pricing.price,

    discountPrice: pricing.discountPrice,

    sellingPrice: pricing.sellingPrice,

    subtotal: pricing.subtotal,

    discount: pricing.discount,
  };
};

/* ==========================================================
   Build Buy Now Summary
========================================================== */

export const buildBuyNowSummary = async ({
  productId,
  variantIndex = -1,
  quantity,
  deliveryCharge = 0,
}) => {
  validateQuantity(quantity);

  const product = await getProduct(productId);

  const variant = getVariant(product, variantIndex);

  const item = buildCheckoutItem(product, variant, quantity, variantIndex);

  const pricing = calculateOrderPricing([item], deliveryCharge);

  return {
    items: [item],
    pricing,
  };
};

/* ==========================================================
   Build Cart Summary
========================================================== */

export const buildCartSummary = async ({ customerId, deliveryCharge = 0 }) => {
  const cart = await Cart.findOne({ customer: customerId }).populate({
    path: "items.product",
    populate: {
      path: "sellerId",
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const items = [];
  const unavailableItems = [];

  for (const cartItem of cart.items) {
    const product = cartItem.product;

    // Product deleted
    if (!product) {
      unavailableItems.push({
        reason: "Product no longer exists.",
      });

      continue;
    }

    // Product unavailable
    if (product.isDeleted || !product.isAvailable) {
      unavailableItems.push({
        product: product._id,
        productName: product.productName,
        reason: "Product is unavailable.",
      });

      continue;
    }

    try {
      const variant = getVariant(product, cartItem.variantIndex);

      const item = buildCheckoutItem(
        product,
        variant,
        cartItem.quantity,
        cartItem.variantIndex,
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
    throw new Error("No valid products found in cart.");
  }

  const pricing = calculateOrderPricing(items, deliveryCharge);

  return {
    items,
    unavailableItems,
    pricing,
  };
};
