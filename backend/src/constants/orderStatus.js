// constants/orderStatus.js

export const ORDER_STATUS = {
  ORDERED: "ordered",
  CONFIRMED: "confirmed",
  NOT_AVAILABLE: "notAvailable",
  OUT_FOR_DELIVERY: "outForDelivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export const SELLER_ALLOWED_STATUS = [
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.NOT_AVAILABLE,
];

export const DELIVERY_ALLOWED_STATUS = [
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
];

export const CUSTOMER_CANCELLABLE_STATUS = [
  ORDER_STATUS.ORDERED,
  ORDER_STATUS.CONFIRMED,
];

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
};
