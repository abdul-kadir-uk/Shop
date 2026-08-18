// controllers/telegramController.js
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

    // ------------------------------------------------------
    // Prevent one Telegram account from being connected
    // to another website account.
    // ------------------------------------------------------

    const existingConnection = await User.findOne({
      telegramChatId: String(chatId),
      _id: { $ne: user._id },
    });

    if (existingConnection) {
      return res.sendStatus(200);
    }

    user.telegramChatId = String(chatId);
    user.telegramConnectedAt = new Date();

    await user.save();

    const { sendTelegramMessage } = await import("../utils/telegram.js");

    await sendTelegramMessage(
      chatId,
      `
<b>✅ Telegram Connected</b>

Hello <b>${user.name}</b>!

Your Telegram notifications are now connected to your account.

You will receive important notifications here.
`.trim(),
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error("Telegram Webhook Error:", error);

    // Telegram expects successful response.
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

    user.telegramChatId = null;
    user.telegramConnectedAt = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Telegram notifications disconnected.",
    });
  } catch (error) {
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
      "telegramChatId telegramConnectedAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      connected: Boolean(user.telegramChatId),
      connectedAt: user.telegramConnectedAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Telegram status.",
    });
  }
};
