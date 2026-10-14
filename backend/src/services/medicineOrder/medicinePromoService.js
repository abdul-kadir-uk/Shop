// src/services/medicineOrder/medicinePromoService.js

const promoError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

/* ==========================================================
   Calculate Medicine Promo
   No medicine promo codes are configured yet.
========================================================== */

export const calculateMedicinePromo = async ({ promoCode }) => {
  const code = String(promoCode || "")
    .trim()
    .toUpperCase();

  if (!code) {
    return {
      promoCode: null,
      promoDiscount: 0,
    };
  }

  throw promoError("This promo code is not available for medicine orders.");
};
