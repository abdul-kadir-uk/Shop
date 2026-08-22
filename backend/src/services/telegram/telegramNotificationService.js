// services/telegram/telegramNotificationService.js

import User from "../../models/User.js";
import Seller from "../../models/Seller.js";
import DeliveryPartner from "../../models/DeliveryPartner.js";

import { sendTelegramMessage } from "../../utils/telegram.js";

/* ==========================================================
   NEW ORDER
   Notify all sellers involved in the order
========================================================== */

const getTelegramChatIds = (user) => {
  const chatIds = [];

  // New multi-chat system
  if (Array.isArray(user?.telegramConnections)) {
    for (const connection of user.telegramConnections) {
      if (connection?.chatId) {
        chatIds.push(String(connection.chatId));
      }
    }
  }

  // Legacy production connection
  if (user?.telegramChatId && !chatIds.includes(String(user.telegramChatId))) {
    chatIds.push(String(user.telegramChatId));
  }

  return [...new Set(chatIds)];
};

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
    }).populate("userId", "name telegramChatId telegramConnections");

    for (const seller of sellers) {
      try {
        const chatIds = getTelegramChatIds(seller.userId);

        if (chatIds.length === 0) {
          continue;
        }

        const sellerItems = order.items.filter(
          (item) => item.seller?.toString() === seller._id.toString(),
        );

        if (sellerItems.length === 0) {
          continue;
        }

        const itemLines = sellerItems
          .map(
            (item) =>
              `• ${item.productName} × ${item.quantity} — ₹${item.subtotal}`,
          )
          .join("\n");

        const sellerTotal = sellerItems.reduce(
          (sum, item) => sum + item.subtotal,
          0,
        );

        const message = `
<b>🛒 New Order Received</b>

Order: <b>${order.orderNumber}</b>

<b>Items for your shop:</b>
${itemLines}

<b>Your total:</b> ₹${sellerTotal}

Please open your seller dashboard to confirm or mark items unavailable 
aliauf.com/seller/dashboard.
`.trim();

        for (const chatId of chatIds) {
          await sendTelegramMessage(chatId, message);
        }
      } catch (error) {
        console.error(
          `Seller New Order Telegram Error (${seller._id}):`,
          error,
        );
      }
    }
  } catch (error) {
    console.error("Notify Sellers New Order Error:", error);
  }
};

/* ==========================================================
   NEW ORDER
   Notify ALL approved delivery partners assigned
   to the order's city.

   IMPORTANT:
   A newly placed order normally has NO deliveryPartner
   because nobody has accepted it yet.

   Therefore we intentionally DO NOT check
   item.deliveryPartner here.
========================================================== */

export const notifyDeliveryPartnersNewOrder = async (order) => {
  try {
    const cityId = order.shippingAddress?.city?._id;

    if (!cityId) {
      return;
    }

    const deliveryPartners = await DeliveryPartner.find({
      approvalStatus: "approved",
      assignedCities: cityId,
    }).populate("userId", "name telegramChatId");

    if (deliveryPartners.length === 0) {
      return;
    }

    const message = `
<b>🚚 New Delivery Available</b>

Order: <b>${order.orderNumber}</b>

City: <b>${order.shippingAddress?.city?.name || "N/A"}</b>

Address:
${order.shippingAddress?.address || "N/A"}

Items: <b>${order.items.length}</b>

Order Total: <b>₹${order.pricing?.total || 0}</b>

Please open the delivery dashboard to view and accept this order
aliauf.com/delivery/dashboard
.
`.trim();

    for (const deliveryPartner of deliveryPartners) {
      try {
        if (!deliveryPartner.userId?.telegramChatId) {
          continue;
        }

        await sendTelegramMessage(
          deliveryPartner.userId.telegramChatId,
          message,
        );
      } catch (error) {
        console.error(
          `Delivery Partner New Order Telegram Error (${deliveryPartner._id}):`,
          error,
        );
      }
    }
  } catch (error) {
    console.error("Notify Delivery Partners New Order Error:", error);
  }
};

/* ==========================================================
   NEW ORDER
   Notify Admin(s)

   Admin does not have a separate model.
   Admin is stored in User with:
     role: "admin"
     isSystemAdmin: true
     telegramChatId
========================================================== */

export const notifyAdminNewOrder = async (order) => {
  try {
    const admins = await User.find({
      role: "admin",
      isSystemAdmin: true,
      telegramChatId: { $ne: null },
    }).select("name telegramChatId");

    if (admins.length === 0) {
      return;
    }

    const itemLines = order.items
      .map(
        (item) =>
          `• ${item.productName} × ${item.quantity} — ₹${item.subtotal}`,
      )
      .join("\n");

    const message = `
<b>🛒 NEW ORDER</b>

Order: <b>${order.orderNumber}</b>

<b>Items:</b>
${itemLines}

<b>Item Count:</b> ${order.items.length}

<b>Delivery City:</b>
${order.shippingAddress?.city?.name || "N/A"}

<b>Address:</b>
${order.shippingAddress?.address || "N/A"}

<b>Payment:</b> ${order.paymentMethod}

<b>Order Total:</b> ₹${order.pricing?.total || 0}

<b>Status:</b> ${order.orderStatus}

A new order has been placed
aliauf.com
.
`.trim();

    for (const admin of admins) {
      try {
        await sendTelegramMessage(admin.telegramChatId, message);
      } catch (error) {
        console.error(`Admin New Order Telegram Error (${admin._id}):`, error);
      }
    }
  } catch (error) {
    console.error("Notify Admin New Order Error:", error);
  }
};

/* ==========================================================
   CANCELLED ORDER
   Notify relevant sellers
========================================================== */

export const notifySellersOrderCancelled = async (order) => {
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
      try {
        if (!seller.userId?.telegramChatId) {
          continue;
        }

        const sellerItems = order.items.filter(
          (item) => item.seller?.toString() === seller._id.toString(),
        );

        if (sellerItems.length === 0) {
          continue;
        }

        const itemLines = sellerItems
          .map((item) => `• ${item.productName} × ${item.quantity}`)
          .join("\n");

        const message = `
<b>❌ Order Cancelled</b>

Order: <b>${order.orderNumber}</b>

<b>Items from your shop:</b>
${itemLines}

The customer has cancelled this order
aliauf.com/seller/dashboard
.
`.trim();

        await sendTelegramMessage(seller.userId.telegramChatId, message);
      } catch (error) {
        console.error(
          `Seller Cancellation Telegram Error (${seller._id}):`,
          error,
        );
      }
    }
  } catch (error) {
    console.error("Notify Sellers Order Cancelled Error:", error);
  }
};

/* ==========================================================
   CANCELLED ORDER
   Notify ONLY delivery partner(s) who accepted the order.

   If every item has deliveryPartner = null:
   → NO delivery notification.

   If a delivery partner accepted the order:
   → Notify that partner.

   We NEVER notify all city delivery partners here.
========================================================== */

export const notifyDeliveryPartnersOrderCancelled = async (order) => {
  try {
    const deliveryPartnerIds = [
      ...new Set(
        order.items
          .map((item) => item.deliveryPartner?.toString())
          .filter(Boolean),
      ),
    ];

    if (deliveryPartnerIds.length === 0) {
      return;
    }

    const deliveryPartners = await DeliveryPartner.find({
      _id: { $in: deliveryPartnerIds },
    }).populate("userId", "name telegramChatId");

    if (deliveryPartners.length === 0) {
      return;
    }

    const message = `
<b>❌ Order Cancelled</b>

Order: <b>${order.orderNumber}</b>

City: <b>${order.shippingAddress?.city?.name || "N/A"}</b>

Address:
${order.shippingAddress?.address || "N/A"}

The customer has cancelled this order
aliauf.com/delivery/dashboard
.
`.trim();

    for (const deliveryPartner of deliveryPartners) {
      try {
        if (!deliveryPartner.userId?.telegramChatId) {
          continue;
        }

        await sendTelegramMessage(
          deliveryPartner.userId.telegramChatId,
          message,
        );
      } catch (error) {
        console.error(
          `Delivery Partner Cancellation Telegram Error (${deliveryPartner._id}):`,
          error,
        );
      }
    }
  } catch (error) {
    console.error("Notify Delivery Partners Order Cancelled Error:", error);
  }
};

/* ==========================================================
   CANCELLED ORDER
   Notify Admin(s)
========================================================== */

export const notifyAdminOrderCancelled = async (order) => {
  try {
    const admins = await User.find({
      role: "admin",
      isSystemAdmin: true,
      telegramChatId: { $ne: null },
    }).select("name telegramChatId");

    if (admins.length === 0) {
      return;
    }

    const itemLines = order.items
      .map(
        (item) =>
          `• ${item.productName} × ${item.quantity} — ₹${item.subtotal}`,
      )
      .join("\n");

    const message = `
<b>❌ ORDER CANCELLED</b>

Order: <b>${order.orderNumber}</b>

<b>Items:</b>
${itemLines}

<b>Item Count:</b> ${order.items.length}

<b>Delivery City:</b>
${order.shippingAddress?.city?.name || "N/A"}

<b>Address:</b>
${order.shippingAddress?.address || "N/A"}

<b>Payment:</b> ${order.paymentMethod}

<b>Order Total:</b> ₹${order.pricing?.total || 0}

<b>Status:</b> ${order.orderStatus}

The customer has cancelled this order
aliauf.com
.
`.trim();

    for (const admin of admins) {
      try {
        await sendTelegramMessage(admin.telegramChatId, message);
      } catch (error) {
        console.error(
          `Admin Cancellation Telegram Error (${admin._id}):`,
          error,
        );
      }
    }
  } catch (error) {
    console.error("Notify Admin Order Cancelled Error:", error);
  }
};
