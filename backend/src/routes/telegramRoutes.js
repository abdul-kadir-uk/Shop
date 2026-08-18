// routes/telegramRoutes.js
import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  generateTelegramConnectLink,
  telegramWebhook,
  disconnectTelegram,
  getTelegramStatus,
} from "../controllers/telegramController.js";

const router = express.Router();

// User connects Telegram
router.get("/connect", protect, generateTelegramConnectLink);

// Telegram calls this endpoint
router.post("/webhook", telegramWebhook);

// User disconnects Telegram
router.patch("/disconnect", protect, disconnectTelegram);

// Check connection
router.get("/status", protect, getTelegramStatus);

export default router;
