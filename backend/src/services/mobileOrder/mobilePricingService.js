// src/services/mobileOrder/mobilePricingService.js

/* ==========================================================
   Calculate Item Pricing
========================================================== */

export const calculateMobileItemPricing = ({
  price,
  discountPrice,
  colorPrice = null,
  quantity,
}) => {
  const originalPrice = Number(price);

  const hasColorPrice =
    colorPrice !== null && colorPrice !== undefined && Number(colorPrice) > 0;

  const currentColorPrice = hasColorPrice ? Number(colorPrice) : null;

  /* --------------------------------------------------------
     Current Discount Price
     
     Same logic as ProductInfo.tsx:
     
     - If color has its own price AND it is lower than
       original product price, color price is the discounted
       selling price.
     
     - Otherwise, if there is no color price, use the normal
       product discountPrice.
     
     - If color price is higher than original price, it is
       still the selling price, but there is NO discount.
  -------------------------------------------------------- */

  const currentDiscountPrice =
    hasColorPrice && currentColorPrice < originalPrice
      ? currentColorPrice
      : !hasColorPrice &&
          discountPrice !== null &&
          discountPrice !== undefined &&
          Number(discountPrice) > 0 &&
          Number(discountPrice) < originalPrice
        ? Number(discountPrice)
        : null;

  /* --------------------------------------------------------
     Selling Price
     
     Same logic as ProductInfo.tsx.
  -------------------------------------------------------- */

  const sellingPrice = hasColorPrice
    ? currentColorPrice
    : (currentDiscountPrice ?? originalPrice);

  const validQuantity = Number(quantity);

  const subtotal = sellingPrice * validQuantity;

  const originalSubtotal = originalPrice * validQuantity;

  const discount =
    currentDiscountPrice !== null
      ? Math.max(originalSubtotal - subtotal, 0)
      : 0;

  return {
    // ALWAYS the actual product price
    price: originalPrice,

    // Effective discount price
    discountPrice: currentDiscountPrice,

    // Actual selling price
    sellingPrice,

    // Final item total
    subtotal,

    // Total discount for this item
    discount,
  };
};

/* ==========================================================
   Calculate Order Pricing
========================================================== */

export const calculateMobileOrderPricing = (items, deliveryCharge = 0) => {
  const subtotal = items.reduce(
    (total, item) => total + Number(item.subtotal),
    0,
  );

  const discount = items.reduce(
    (total, item) => total + Number(item.discount),
    0,
  );

  const finalDeliveryCharge = Number(deliveryCharge) || 0;

  const total = subtotal + finalDeliveryCharge;

  return {
    subtotal,
    discount,
    deliveryCharge: finalDeliveryCharge,
    total,
  };
};
