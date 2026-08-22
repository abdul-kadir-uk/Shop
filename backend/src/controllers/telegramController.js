import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ==========================================================
// Generate Telegram Connection Link
// GET /api/telegram/connect
// ==========================================================

export const generateTelegramConnectLink = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        purpose: "telegramConnect",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      },
    );

    const botUsername = process.env.TELEGRAM_BOT_USERNAME;

    if (!botUsername) {
      return res.status(500).json({
        success: false,
        message: "Telegram bot is not configured.",
      });
    }

    const telegramUrl = `https://t.me/${botUsername}?start=${token}`;

    return res.status(200).json({
      success: true,
      telegramUrl,
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("Generate Telegram Link Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate Telegram connection link.",
    });
  }
};

// ==========================================================
// Telegram Webhook
// POST /api/telegram/webhook
// ==========================================================

export const telegramWebhook = async (req, res) => {
  try {
    const secret = req.headers["x-telegram-bot-api-secret-token"];

    if (
      process.env.TELEGRAM_WEBHOOK_SECRET &&
      secret !== process.env.TELEGRAM_WEBHOOK_SECRET
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const message = req.body?.message;

    if (!message) {
      return res.sendStatus(200);
    }

    const chatId = message.chat?.id;
    const text = message.text || "";

    if (!chatId || !text.startsWith("/start")) {
      return res.sendStatus(200);
    }

    const parts = text.split(" ");
    const token = parts[1];

    if (!token) {
      return res.sendStatus(200);
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.sendStatus(200);
    }

    if (decoded.purpose !== "telegramConnect") {
      return res.sendStatus(200);
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.sendStatus(200);
    }

    const telegramChatId = String(chatId);

    // ======================================================
    // DELIVERY + ADMIN
    //
    // Keep the existing single Telegram chat ID system.
    // Do NOT use telegramConnections for these roles.
    // ======================================================

    if (user.role === "delivery" || user.role === "admin") {
      // ----------------------------------------------------
      // Check whether this Telegram chat belongs to
      // another Aliauf account.
      // ----------------------------------------------------

      const existingConnection = await User.findOne({
        $or: [
          {
            telegramChatId: telegramChatId,
          },
          {
            "telegramConnections.chatId": telegramChatId,
          },
        ],
        _id: { $ne: user._id },
      });

      if (existingConnection) {
        console.warn(
          `Telegram chat ${telegramChatId} attempted to connect to another account.`,
        );

        return res.sendStatus(200);
      }

      // ----------------------------------------------------
      // If this exact Telegram account is already connected
      // to this user, do not send success message again.
      // ----------------------------------------------------

      if (user.telegramChatId === telegramChatId) {
        return res.sendStatus(200);
      }

      // ----------------------------------------------------
      // Keep existing single-chat behavior.
      //
      // If the user connects a new Telegram account, the
      // old telegramChatId is replaced.
      // ----------------------------------------------------

      user.telegramChatId = telegramChatId;
      user.telegramConnectedAt = new Date();

      await user.save();

      // ----------------------------------------------------
      // Send success message ONLY for a new connection.
      // ----------------------------------------------------

      const { sendTelegramMessage } = await import("../utils/telegram.js");

      await sendTelegramMessage(
        telegramChatId,
        `
<b>✅ You are successfully connected to the Telegram.</b>
`.trim(),
      );

      console.log(
        `Telegram connected successfully for ${user.role} ${user._id}, chat ${telegramChatId}`,
      );

      return res.sendStatus(200);
    }

    // ======================================================
    // SELLER
    //
    // Sellers can have multiple Telegram connections.
    // ======================================================

    if (user.role === "seller") {
      // ----------------------------------------------------
      // Make sure the array exists.
      // ----------------------------------------------------

      if (!Array.isArray(user.telegramConnections)) {
        user.telegramConnections = [];
      }

      // ----------------------------------------------------
      // Backward compatibility.
      //
      // If seller was connected using the old
      // telegramChatId field, move that connection into
      // telegramConnections.
      // ----------------------------------------------------

      if (
        user.telegramChatId &&
        !user.telegramConnections.some(
          (connection) => connection.chatId === String(user.telegramChatId),
        )
      ) {
        user.telegramConnections.push({
          chatId: String(user.telegramChatId),
          connectedAt: user.telegramConnectedAt || new Date(),
        });
      }

      // ----------------------------------------------------
      // Check whether this Telegram chat belongs to
      // another Aliauf account.
      // ----------------------------------------------------

      const existingConnection = await User.findOne({
        $or: [
          {
            telegramChatId: telegramChatId,
          },
          {
            "telegramConnections.chatId": telegramChatId,
          },
        ],
        _id: { $ne: user._id },
      });

      if (existingConnection) {
        console.warn(
          `Telegram chat ${telegramChatId} attempted to connect to another account.`,
        );

        return res.sendStatus(200);
      }

      // ----------------------------------------------------
      // Check whether THIS Telegram chat is already
      // connected to THIS seller.
      // ----------------------------------------------------

      const alreadyConnected = user.telegramConnections.some(
        (connection) => connection.chatId === telegramChatId,
      );

      // ----------------------------------------------------
      // Already connected:
      // DO NOT send success message again.
      // ----------------------------------------------------

      if (alreadyConnected) {
        await user.save();

        return res.sendStatus(200);
      }

      // ----------------------------------------------------
      // New seller Telegram connection.
      // ----------------------------------------------------

      user.telegramConnections.push({
        chatId: telegramChatId,
        connectedAt: new Date(),
      });

      await user.save();

      // ----------------------------------------------------
      // Send success message ONLY for a new connection.
      // ----------------------------------------------------

      const { sendTelegramMessage } = await import("../utils/telegram.js");

      await sendTelegramMessage(
        telegramChatId,
        `
<b>✅ You are successfully connected to the Telegram.</b>
`.trim(),
      );

      console.log(
        `Telegram connected successfully for seller ${user._id}, chat ${telegramChatId}`,
      );

      return res.sendStatus(200);
    }

    // ======================================================
    // Other roles
    //
    // Currently nothing to do.
    // ======================================================

    return res.sendStatus(200);
  } catch (error) {
    console.error("Telegram Webhook Error:", error);

    // Telegram expects a successful response.
    return res.sendStatus(200);
  }
};

// ==========================================================
// Disconnect Telegram
// PATCH /api/telegram/disconnect
// ==========================================================

export const disconnectTelegram = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ======================================================
    // Seller
    // Multiple Telegram connections
    // ======================================================

    if (user.role === "seller") {
      user.telegramConnections = [];

      // Keep legacy fields cleared as well.
      user.telegramChatId = null;
      user.telegramConnectedAt = null;
    }

    // ======================================================
    // Delivery + Admin
    // Existing single Telegram connection
    // ======================================================
    else {
      user.telegramChatId = null;
      user.telegramConnectedAt = null;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Telegram notifications disconnected.",
    });
  } catch (error) {
    console.error("Disconnect Telegram Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to disconnect Telegram.",
    });
  }
};

// ==========================================================
// Telegram Status
// GET /api/telegram/status
// ==========================================================

export const getTelegramStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "role telegramChatId telegramConnectedAt telegramConnections",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ======================================================
    // DELIVERY + ADMIN
    //
    // Use ONLY the old single telegramChatId.
    // ======================================================

    if (user.role === "delivery" || user.role === "admin") {
      return res.status(200).json({
        success: true,
        connected: Boolean(user.telegramChatId),
        connectedAt: user.telegramConnectedAt,
      });
    }

    // ======================================================
    // SELLER
    //
    // Use multiple telegramConnections.
    //
    // Also include the old production connection if it
    // hasn't been migrated yet.
    // ======================================================

    if (user.role === "seller") {
      const connections = Array.isArray(user.telegramConnections)
        ? [...user.telegramConnections]
        : [];

      if (
        user.telegramChatId &&
        !connections.some(
          (connection) => connection.chatId === String(user.telegramChatId),
        )
      ) {
        connections.push({
          chatId: String(user.telegramChatId),
          connectedAt: user.telegramConnectedAt,
        });
      }

      return res.status(200).json({
        success: true,
        connected: connections.length > 0,
        connectionCount: connections.length,
        connections,
      });
    }

    // ======================================================
    // Other roles
    // ======================================================

    return res.status(200).json({
      success: true,
      connected: false,
    });
  } catch (error) {
    console.error("Get Telegram Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Telegram status.",
    });
  }
};
