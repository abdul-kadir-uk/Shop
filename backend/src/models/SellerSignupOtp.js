// models/SellerSignupOtp.js

import mongoose from "mongoose";

const sellerSignupOtpSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // Seller signup information
    // --------------------------------------------------

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    shopName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["groceries", "mobile-repair"],
      required: true,
    },

    gstinNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    // Already hashed before being stored
    password: {
      type: String,
      required: true,
    },

    securityQuestion: {
      type: String,
      required: true,
    },

    // Already hashed before being stored
    securityAnswer: {
      type: String,
      required: true,
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

// Automatically delete expired OTP signup records
sellerSignupOtpSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

const SellerSignupOtp = mongoose.model(
  "SellerSignupOtp",
  sellerSignupOtpSchema,
);

export default SellerSignupOtp;
