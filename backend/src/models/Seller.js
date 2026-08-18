// models/Seller.js

import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    shopName: {
      type: String,
      required: true,
      trim: true,
    },

    gstinNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
        "Please provide a valid GSTIN number",
      ],
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    // Seller's operating city
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },

    category: {
      type: String,
      enum: ["groceries", "mobile-repair"],
      required: true,
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const Seller = mongoose.model("Seller", sellerSchema);

export default Seller;
