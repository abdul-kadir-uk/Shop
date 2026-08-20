// models/CustomerSignupOtp.js

import mongoose from "mongoose";

const customerSignupOtpSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // Customer signup information
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

    securityQuestion: {
      type: String,
      required: true,
    },

    // Already hashed before being stored
    securityAnswer: {
      type: String,
      required: true,
    },

    // Already hashed before being stored
    password: {
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

// Automatically remove expired signup records
customerSignupOtpSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

const CustomerSignupOtp = mongoose.model(
  "CustomerSignupOtp",
  customerSignupOtpSchema,
);

export default CustomerSignupOtp;
