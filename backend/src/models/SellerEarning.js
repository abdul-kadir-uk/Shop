// models/SellerEarning.js

import mongoose from "mongoose";

const sellerEarningSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // Seller
    // --------------------------------------------------

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    // --------------------------------------------------
    // Earnings date
    //
    // This represents the calendar day in IST.
    // We store the day as a Date at UTC midnight so
    // every seller has exactly one record per day.
    // --------------------------------------------------

    date: {
      type: Date,
      required: true,
      index: true,
    },

    // --------------------------------------------------
    // Open Products
    // --------------------------------------------------

    openProducts: {
      productsSold: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalSales: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // --------------------------------------------------
    // Packet Products
    // --------------------------------------------------

    packetProducts: {
      productsSold: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalSales: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // --------------------------------------------------
    // Total
    // --------------------------------------------------

    total: {
      productsSold: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalSales: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // --------------------------------------------------
    // Admin settlement status
    // --------------------------------------------------

    paymentStatus: {
      type: String,
      enum: ["pending", "settled"],
      default: "pending",
      index: true,
    },

    // --------------------------------------------------
    // Settlement information
    //
    // These remain null until admin settles the day.
    // --------------------------------------------------

    settledAt: {
      type: Date,
      default: null,
    },

    settledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ------------------------------------------------------
// One earnings document per seller per calendar day
// ------------------------------------------------------

sellerEarningSchema.index(
  {
    seller: 1,
    date: 1,
  },
  {
    unique: true,
  },
);

// ------------------------------------------------------
// Useful for admin settlement queries
// ------------------------------------------------------

sellerEarningSchema.index({
  paymentStatus: 1,
  date: -1,
});

const SellerEarning = mongoose.model("SellerEarning", sellerEarningSchema);

export default SellerEarning;
