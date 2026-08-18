// utils/telegramService.js

import axios from "axios";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/* ==========================================================
   Send Telegram Message
========================================================== */

export const sendTelegramMessage = async (chatId, message) => {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("Telegram bot token is missing.");
      return {
        success: false,
        message: "Telegram bot token is not configured.",
      };
    }

    if (!chatId) {
      console.warn("Telegram chat ID is missing.");
      return {
        success: false,
        message: "Telegram chat ID is missing.",
      };
    }

    if (!message) {
      return {
        success: false,
        message: "Telegram message is empty.",
      };
    }

    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Telegram Send Error:",
      error.response?.data || error.message,
    );

    return {
      success: false,
      message:
        error.response?.data?.description ||
        error.message ||
        "Failed to send Telegram message.",
    };
  }
};
