// src/services/medicineOrder/medicinePricingService.js

/* ==========================================================
   Get Selling Price
========================================================== */

export const getMedicineSellingPrice = (price, discountPrice = null) => {
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
   Calculate Single Medicine Item
========================================================== */

export const calculateMedicineItemPricing = ({
  price,
  discountPrice,
  quantity,
}) => {
  const sellingPrice = getMedicineSellingPrice(price, discountPrice);

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
   Calculate Medicine Order Totals
========================================================== */

export const calculateMedicineOrderPricing = (items, deliveryCharge = 0) => {
  let subtotal = 0;
  let discount = 0;

  for (const item of items) {
    subtotal += item.subtotal;
    discount += item.discount;
  }

  return {
    subtotal,
    discount,
    deliveryCharge,
    total: subtotal + deliveryCharge,
  };
};
