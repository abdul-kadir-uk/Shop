// models/DeliverySignupOtp.js

import mongoose from "mongoose";

const deliverySignupOtpSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // Delivery signup information
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

    address: {
      type: String,
      required: true,
      trim: true,
    },

    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },

    aadhaarNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // S3 object key of uploaded Aadhaar document
    aadhaarDocument: {
      type: String,
      required: true,
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

// Automatically delete expired signup records
deliverySignupOtpSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

const DeliverySignupOtp = mongoose.model(
  "DeliverySignupOtp",
  deliverySignupOtpSchema,
);

export default DeliverySignupOtp;
