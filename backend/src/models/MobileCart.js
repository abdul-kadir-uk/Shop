// models/MobileCart.js

import mongoose from "mongoose";

const mobileCartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MobileProduct",
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    color: {
      type: String,
      default: "",
      trim: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const mobileCartSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
      index: true,
    },

    items: [mobileCartItemSchema],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("MobileCart", mobileCartSchema);
