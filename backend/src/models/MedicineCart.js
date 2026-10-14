// src/models/MedicineCart.js

import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicineProduct",
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Support for medicine pack variants
    variantIndex: {
      type: Number,
      default: -1,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const medicineCartSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
      index: true,
    },

    items: [cartItemSchema],
  },
  {
    timestamps: true,
  },
);

const MedicineCart =
  mongoose.models.MedicineCart ||
  mongoose.model("MedicineCart", medicineCartSchema);

export default MedicineCart;
