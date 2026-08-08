// src/services/order/pricingService.js

/* ==========================================================
   Get Selling Price
========================================================== */

export const getSellingPrice = (price, discountPrice = null) => {
  if (
    discountPrice !== null &&
    discountPrice !== undefined &&
    discountPrice >= 0 &&
    discountPrice < price
  ) {
    return discountPrice;
  }

  return price;
};

/* ==========================================================
   Calculate Single Item
========================================================== */

export const calculateItemPricing = ({ price, discountPrice, quantity }) => {
  const sellingPrice = getSellingPrice(price, discountPrice);

  const subtotal = sellingPrice * quantity;

  const discount = (price - sellingPrice) * quantity;

  return {
    price,
    discountPrice,
    sellingPrice,
    quantity,
    subtotal,
    discount,
  };
};

/* ==========================================================
   Calculate Order Totals
========================================================== */

export const calculateOrderPricing = (items, deliveryCharge = 0) => {
  let subtotal = 0;
  let discount = 0;

  for (const item of items) {
    subtotal += item.subtotal;
    discount += item.discount;
  }

  const total = subtotal + deliveryCharge;

  return {
    subtotal,
    discount,
    deliveryCharge,
    total,
  };
};
