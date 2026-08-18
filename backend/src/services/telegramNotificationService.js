// services/telegramNotificationService.js
import User from "../models/User.js";
import Seller from "../models/Seller.js";
import DeliveryPartner from "../models/DeliveryPartner.js";

import { sendTelegramMessage } from "../utils/telegram.js";

// ==========================================================
// Safe Telegram Send
// ==========================================================

const notifyUser = async (userId, message) => {
  try {
    const user = await User.findById(userId).select("telegramChatId name role");

    if (!user?.telegramChatId) {
      return;
    }

    await sendTelegramMessage(user.telegramChatId, message);
  } catch (error) {
    // Telegram failure must NEVER break the main business operation.
    console.error("Telegram user notification error:", error);
  }
};

// ==========================================================
// Notify Sellers About New Order
// ==========================================================

export const notifySellersNewOrder = async (order) => {
  try {
    const sellerIds = [
      ...new Set(
        order.items.map((item) => item.seller?.toString()).filter(Boolean),
      ),
    ];

    if (sellerIds.length === 0) {
      return;
    }

    const sellers = await Seller.find({
      _id: { $in: sellerIds },
    }).populate("userId", "name telegramChatId");

    for (const seller of sellers) {
      if (!seller.userId?.telegramChatId) {
        continue;
      }

      const sellerItems = order.items.filter(
        (item) => item.seller?.toString() === seller._id.toString(),
      );

      const itemLines = sellerItems
        .map(
          (item) =>
            `• ${item.productName} × ${item.quantity} — ₹${item.subtotal}`,
        )
        .join("\n");

      const message = `
<b>🛒 New Order Received</b>

Order: <b>${order.orderNumber}</b>

<b>Items for your shop:</b>
${itemLines}

<b>Your total:</b> ₹${sellerItems.reduce((sum, item) => sum + item.subtotal, 0)}

Please open your seller dashboard to confirm or mark items unavailable.
`;

      await sendTelegramMessage(seller.userId.telegramChatId, message.trim());
    }
  } catch (error) {
    console.error("Notify Sellers New Order Error:", error);
  }
};

// ==========================================================
// Notify Delivery Partners
// ==========================================================

export const notifyDeliveryPartnersNewOrder = async (order) => {
  try {
    const cityId = order.shippingAddress?.city?._id;

    if (!cityId) {
      return;
    }

    const deliveryPartners = await DeliveryPartner.find({
      approvalStatus: "approved",
      assignedCities: cityId,
    }).populate("userId", "telegramChatId");

    if (deliveryPartners.length === 0) {
      return;
    }

    const message = `
<b>🚚 New Delivery Available</b>

Order: <b>${order.orderNumber}</b>

City: <b>${order.shippingAddress.city.name}</b>

Address:
${order.shippingAddress.address}

Items: <b>${order.items.length}</b>

Please open the delivery dashboard to accept this order.
`.trim();

    for (const deliveryPartner of deliveryPartners) {
      if (!deliveryPartner.userId?.telegramChatId) {
        continue;
      }

      await sendTelegramMessage(deliveryPartner.userId.telegramChatId, message);
    }
  } catch (error) {
    console.error("Notify Delivery Partners Error:", error);
  }
};

// ==========================================================
// Seller Item Status → Customer
// ==========================================================

export const notifyCustomerSellerItemStatus = async ({
  order,
  item,
  status,
}) => {
  try {
    const message =
      status === "confirmed"
        ? `
<b>✅ Item Confirmed</b>

Order: <b>${order.orderNumber}</b>

Product:
<b>${item.productName}</b>

Quantity: <b>${item.quantity}</b>

The seller has confirmed this item.
`.trim()
        : `
<b>⚠️ Item Unavailable</b>

Order: <b>${order.orderNumber}</b>

Product:
<b>${item.productName}</b>

Unfortunately, this item is unavailable from the seller.
`.trim();

    await notifyCustomer(order.customer, message);
  } catch (error) {
    console.error("Notify Customer Seller Status Error:", error);
  }
};

// ==========================================================
// Customer Notification Helper
// ==========================================================

export const notifyCustomer = async (customerId, message) => {
  try {
    const customer = await User.findOne({
      _id: await getUserIdFromCustomer(customerId),
    }).select("telegramChatId");

    if (!customer?.telegramChatId) {
      return;
    }

    await sendTelegramMessage(customer.telegramChatId, message);
  } catch (error) {
    console.error("Notify Customer Error:", error);
  }
};

// ==========================================================
// Customer model → User ID
// ==========================================================

const getUserIdFromCustomer = async (customerId) => {
  const Customer = (await import("../models/Customer.js")).default;

  const customer = await Customer.findById(customerId).select("userId");

  return customer?.userId || null;
};

// ==========================================================
// Delivery Accepted
// ==========================================================

export const notifyCustomerDeliveryAccepted = async (order) => {
  const message = `
<b>🚚 Delivery Partner Assigned</b>

Order: <b>${order.orderNumber}</b>

A delivery partner has accepted your order.

We will notify you when your order is out for delivery.
`.trim();

  await notifyCustomer(order.customer, message);
};

// ==========================================================
// Order Out For Delivery
// ==========================================================

export const notifyCustomerOutForDelivery = async (order) => {
  const message = `
<b>🚚 Order Out For Delivery</b>

Order: <b>${order.orderNumber}</b>

Your order is now out for delivery.

Please keep your phone available.
`.trim();

  await notifyCustomer(order.customer, message);
};

// ==========================================================
// Order Delivered
// ==========================================================

export const notifyCustomerOrderDelivered = async (order) => {
  const message = `
<b>🎉 Order Delivered</b>

Order: <b>${order.orderNumber}</b>

Your order has been delivered successfully.

Thank you for shopping with us!
`.trim();

  await notifyCustomer(order.customer, message);
};

// ==========================================================
// Order Cancelled
// ==========================================================

export const notifyCustomerOrderCancelled = async (order) => {
  const message = `
<b>❌ Order Cancelled</b>

Order: <b>${order.orderNumber}</b>

Your order has been cancelled.
`.trim();

  await notifyCustomer(order.customer, message);
};
