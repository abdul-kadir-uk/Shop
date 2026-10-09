import Order from "../../models/Order.js";

const PROMO_CODES = {
  GROCERY50: {
    type: "fixed",
    value: 50,
    minimumSubtotal: 500,
  },
  GROCERY30: {
    type: "fixed",
    value: 30,
    minimumSubtotal: 300,
  },
  GROCERY10: {
    type: "percentage",
    value: 10,
    maximumDiscount: 50,
    minimumSubtotal: 100,
  },
};

const promoError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

export const calculatePromo = async ({
  promoCode,
  customerId,
  subtotal,
  session,
}) => {
  const code = String(promoCode || "")
    .trim()
    .toUpperCase();

  if (!code) {
    return {
      promoCode: null,
      promoDiscount: 0,
    };
  }

  const promo = PROMO_CODES[code];

  if (!promo) {
    throw promoError("Invalid promo code.");
  }

  if (subtotal < promo.minimumSubtotal) {
    throw promoError(
      `${code} requires a minimum grocery subtotal of ₹${promo.minimumSubtotal}.`,
    );
  }

  let previousOrderQuery = Order.findOne({
    customer: customerId,
  }).select("_id");

  if (session) {
    previousOrderQuery = previousOrderQuery.session(session);
  }

  const previousGroceryOrder = await previousOrderQuery;

  if (previousGroceryOrder) {
    throw promoError(
      "This promo code is available only to customers who have never placed a grocery order.",
    );
  }

  const promoDiscount =
    promo.type === "percentage"
      ? Math.min(
          Math.round((subtotal * promo.value) / 100),
          promo.maximumDiscount,
        )
      : promo.value;

  return {
    promoCode: code,
    promoDiscount,
  };
};
