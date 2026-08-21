// models/PasswordResetOtp.js

import mongoose from "mongoose";

const passwordResetOtpSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // User mobile number
    // --------------------------------------------------

    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // --------------------------------------------------
    // OTP
    // --------------------------------------------------

    otpHash: {
      type: String,
      required: true,
    },

    otpExpiresAt: {
      type: Date,
      required: true,
    },

    // --------------------------------------------------
    // OTP security
    // --------------------------------------------------

    attempts: {
      type: Number,
      default: 0,
    },

    lastOtpSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Automatically delete expired OTP records
passwordResetOtpSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetOtp = mongoose.model(
  "PasswordResetOtp",
  passwordResetOtpSchema,
);

export default PasswordResetOtp;
