// utils/telegram.js
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// ==========================================================
// Send Telegram Message
// ==========================================================

export const sendTelegramMessage = async (chatId, text, options = {}) => {
  if (!chatId) {
    return {
      success: false,
      skipped: true,
      message: "Telegram chat ID is not connected.",
    };
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not configured.");

    return {
      success: false,
      skipped: true,
      message: "Telegram bot is not configured.",
    };
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Telegram API Error:", data);

      return {
        success: false,
        message: data.description || "Telegram message failed.",
      };
    }

    return {
      success: true,
      messageId: data.result?.message_id || null,
    };
  } catch (error) {
    console.error("Telegram Send Error:", error);

    return {
      success: false,
      message: error.message,
    };
  }
};
