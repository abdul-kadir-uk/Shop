// src/services/mobileOrder/mobileOrderService.js

import {
  getMobileProduct,
  validateQuantity,
} from "./mobileValidationService.js";

import {
  calculateMobileItemPricing,
  calculateMobileOrderPricing,
} from "./mobilePricingService.js";

import MobileCart from "../../models/MobileCart.js";

/* ==========================================================
   Build Mobile Variant Snapshot
========================================================== */

const buildMobileVariant = (product) => {
  return {
    variantGroupId: product.variantGroupId || "",
    variantName: product.variantName || "",
    ram: product.ram || "",
    storage: product.storage || "",
  };
};

/* ==========================================================
   Get Price For Selected Color
========================================================== */

const getColorPrice = (product, color) => {
  if (!color) {
    return null;
  }

  const selectedColor = product.colors?.find(
    (productColor) =>
      productColor.name?.trim().toLowerCase() === color.trim().toLowerCase(),
  );

  if (
    selectedColor?.price !== null &&
    selectedColor?.price !== undefined &&
    Number(selectedColor.price) > 0
  ) {
    return Number(selectedColor.price);
  }

  return null;
};

/* ==========================================================
   Build Mobile Checkout Item
========================================================== */

const buildMobileCheckoutItem = (product, quantity, selectedColor = "") => {
  /*
   * IMPORTANT:
   *
   * product.price is ALWAYS the original product price.
   *
   * Example:
   *
   * Product price = ₹92,999
   *
   * Black color price = ₹85,999
   * Blue color price  = ₹79,999
   * Silver color price = ₹71,999
   *
   * The original price remains ₹92,999 for ALL colors.
   */

  const colorPrice = getColorPrice(product, selectedColor);

  const originalPrice = Number(product.price);

  /*
   * Normal product-level discount.
   *
   * This is used ONLY when there is no color-specific price.
   */

  const productDiscountPrice =
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    Number(product.discountPrice) > 0 &&
    Number(product.discountPrice) < originalPrice
      ? Number(product.discountPrice)
      : null;

  /*
   * Calculate final pricing.
   *
   * Color price takes priority over product discount price.
   */

  const pricing = calculateMobileItemPricing({
    price: originalPrice,

    discountPrice: productDiscountPrice,

    colorPrice,

    quantity,
  });

  return {
    product: product._id,

    seller: product.sellerId._id,

    quantity,

    productName: product.productName,

    brand: product.brand || "",

    image: product.mainImage?.url || "",

    variant: buildMobileVariant(product),

    // Selected color
    color: selectedColor || "",

    // Keep the actual color price separately
    colorPrice,

    // Pricing snapshot
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

export const buildMobileBuyNowSummary = async ({
  productId,
  quantity,
  selectedColor = "",
  deliveryCharge = 0,
}) => {
  const validQuantity = validateQuantity(quantity);

  const product = await getMobileProduct(productId);

  const item = buildMobileCheckoutItem(product, validQuantity, selectedColor);

  const pricing = calculateMobileOrderPricing([item], deliveryCharge);

  return {
    items: [item],

    unavailableItems: [],

    pricing,
  };
};

/* ==========================================================
   Build Mobile Cart Summary
========================================================== */

export const buildMobileCartSummary = async ({
  customerId,
  deliveryCharge = 0,
}) => {
  const cart = await MobileCart.findOne({
    customer: customerId,
  }).populate({
    path: "items.product",
    populate: {
      path: "sellerId",
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Mobile cart is empty.");
  }

  const items = [];

  const unavailableItems = [];

  for (const cartItem of cart.items) {
    const product = cartItem.product;

    // --------------------------------------------------
    // Product no longer exists
    // --------------------------------------------------

    if (!product) {
      unavailableItems.push({
        reason: "Mobile product no longer exists.",
      });

      continue;
    }

    // --------------------------------------------------
    // Product unavailable
    // --------------------------------------------------

    if (product.isDeleted || !product.isAvailable) {
      unavailableItems.push({
        product: product._id,

        productName: product.productName,

        reason: "Mobile product is unavailable.",
      });

      continue;
    }

    // --------------------------------------------------
    // Seller missing
    // --------------------------------------------------

    if (!product.sellerId) {
      unavailableItems.push({
        product: product._id,

        productName: product.productName,

        reason: "Seller information is unavailable.",
      });

      continue;
    }

    try {
      const quantity = validateQuantity(cartItem.quantity);

      /*
       * The color is stored inside the cart item.
       *
       * Example:
       *
       * Product: Vivo V70
       * Color: Blue
       *
       * The Blue color price will be used here.
       */
      const selectedColor = cartItem.color || "";

      const item = buildMobileCheckoutItem(product, quantity, selectedColor);

      items.push(item);
    } catch (error) {
      unavailableItems.push({
        product: product._id,

        productName: product.productName,

        reason: error.message,
      });
    }
  }

  // --------------------------------------------------
  // No valid products
  // --------------------------------------------------

  if (items.length === 0) {
    throw new Error("No valid mobile products found in cart.");
  }

  const pricing = calculateMobileOrderPricing(items, deliveryCharge);

  return {
    items,

    unavailableItems,

    pricing,
  };
};
