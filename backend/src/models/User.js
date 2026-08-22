// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    securityQuestion: {
      type: String,
      enum: ["pet", "school", "city", "teacher", "mother"],
      default: null,
    },

    securityAnswer: {
      type: String,
      default: null,
      trim: true,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    passwordResetVersion: {
      type: Number,
      default: 0,
    },

    role: {
      type: String,
      enum: ["customer", "seller", "delivery", "admin"],
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isSystemAdmin: {
      type: Boolean,
      default: false,
    },

    // ======================================================
    // Telegram
    // ======================================================

    telegramConnectToken: {
      type: String,
      default: null,
      index: true,
    },

    telegramConnectTokenExpiresAt: {
      type: Date,
      default: null,
    },

    // NEW:
    // Allows one Aliauf account to have multiple Telegram
    // accounts/chats connected.
    telegramConnections: [
      {
        chatId: {
          type: String,
          required: true,
          trim: true,
        },

        connectedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ------------------------------------------------------
    // LEGACY TELEGRAM FIELDS
    //
    // Keep these temporarily so existing production
    // Telegram connections continue working.
    // ------------------------------------------------------

    telegramChatId: {
      type: String,
      default: null,
      index: true,
    },

    telegramConnectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index the new Telegram chat IDs.
userSchema.index({
  "telegramConnections.chatId": 1,
});

const User = mongoose.model("User", userSchema);

export default User;
